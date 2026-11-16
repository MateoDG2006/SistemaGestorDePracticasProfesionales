import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_SESION = "sgpp_sesion";
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-no-usar-en-produccion";
export const TTL_MIN = Number(process.env.SESSION_TTL_MINUTES ?? "30");

export interface PayloadSesion {
  uid: string;
  iat: number; // epoch ms de la ultima actividad
}

function firmar(data: string): string {
  return createHmac("sha256", SECRET).update(data).digest("base64url");
}

export function serializarSesion(p: PayloadSesion): string {
  const cuerpo = Buffer.from(JSON.stringify(p)).toString("base64url");
  return `${cuerpo}.${firmar(cuerpo)}`;
}

// Verifica firma e inactividad. Sin base de datos (chequeo optimista para proxy).
export function verificarSesion(token: string): PayloadSesion | null {
  const punto = token.lastIndexOf(".");
  if (punto < 0) return null;
  const cuerpo = token.slice(0, punto);
  const firma = token.slice(punto + 1);
  const esperado = firmar(cuerpo);
  const a = Buffer.from(firma);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(cuerpo, "base64url").toString()) as PayloadSesion;
    if (Date.now() - p.iat > TTL_MIN * 60_000) return null;
    return p;
  } catch {
    return null;
  }
}
