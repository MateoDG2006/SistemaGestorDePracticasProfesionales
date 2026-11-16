import { cookies } from "next/headers";
import { prisma } from "@/src/shared/db/prisma";
import { ErrorNoAutenticado, ErrorNoAutorizado } from "@/src/shared/errores/errores";
import type { Rol } from "@/src/shared/dominio/enums";
import { COOKIE_SESION, TTL_MIN, serializarSesion, verificarSesion } from "./token";

export interface UsuarioSesion {
  id: string;
  correo: string;
  nombre: string;
  rol: Rol;
}

async function escribirCookie(uid: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_SESION, serializarSesion({ uid, iat: Date.now() }), {
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
  store.delete(COOKIE_SESION);
}

// Devuelve el usuario autenticado o null. Refresca la cookie (sesion deslizante).
export async function usuarioActual(): Promise<UsuarioSesion | null> {
  const store = await cookies();
  const token = store.get(COOKIE_SESION)?.value;
  if (!token) return null;
  const payload = verificarSesion(token);
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
