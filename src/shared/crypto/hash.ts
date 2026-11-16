import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

// Contrasenas con hash adaptativo (RNF-02).
export async function hashContrasena(plano: string): Promise<string> {
  return bcrypt.hash(plano, 12);
}

export async function verificarContrasena(plano: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plano, hash);
}

// Token de invitacion de un solo uso: se entrega en claro por correo y en la
// base solo se guarda su SHA-256 (RNF-02, Tabla 16).
export function generarToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, hash: sha256Hex(token) };
}

export function sha256Hex(valor: string | Buffer): string {
  return createHash("sha256").update(valor).digest("hex");
}
