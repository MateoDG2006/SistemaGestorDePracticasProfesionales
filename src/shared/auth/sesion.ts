import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/src/shared/db/prisma";
import { ErrorNoAutenticado, ErrorNoAutorizado } from "@/src/shared/errores/errores";
import type { Rol } from "@/src/shared/dominio/enums";

const COOKIE = "sgpp_sesion";
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-no-usar-en-produccion";
const TTL_MIN = Number(process.env.SESSION_TTL_MINUTES ?? "30");

export interface UsuarioSesion {
  id: string;
  correo: string;
  nombre: string;
  rol: Rol;
}

interface Payload {
  uid: string;
  iat: number; // epoch ms de la ultima actividad
}

function firmar(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

function serializar(p: Payload): string {
  const cuerpo = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${cuerpo}.${firmar(cuerpo)}`;
}

function verificar(token: string): Payload | null {
  const punto = token.lastIndexOf(".");
  if (punto < 0) return null;
  const cuerpo = token.slice(0, punto);
  const firma = token.slice(punto + 1);
  const esperado = firmar(cuerpo);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(cuerpo, "base64url").toString()) as Payload;
    if (Date.now() - p.iat > TTL_MIN * 60_000) return null; // inactividad > 30 min
    return p;
  } catch {
    return null;
  }
}

async function escribirCookie(uid: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, serializar({ uid, iat: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MIN * 60,
  });
}

export async function crearSesion(usuarioId: string): Promise<void> {
  await escribirCookie(usuarioId);
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

// Devuelve el usuario autenticado o null. Refresca la cookie (sesion deslizante).
export async function usuarioActual(): Promise<UsuarioSesion | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const payload = verificar(token);
  if (!payload) return null;

  const u = await prisma.usuario.findUnique({ where: { id: payload.uid } });
  if (!u || !u.activo) return null;

  await escribirCookie(u.id); // renueva la ventana de inactividad
  return { id: u.id, correo: u.correo, nombre: u.nombre, rol: u.rol as Rol };
}

// Exige sesion; opcionalmente uno de los roles indicados (RNF-01).
export async function requerirUsuario(...roles: Rol[]): Promise<UsuarioSesion> {
  const u = await usuarioActual();
  if (!u) throw new ErrorNoAutenticado();
  if (roles.length > 0 && !roles.includes(u.rol)) throw new ErrorNoAutorizado();
  return u;
}
