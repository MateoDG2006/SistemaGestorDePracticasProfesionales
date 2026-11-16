import { prisma } from "@/src/shared/db/prisma";
import { verificarContrasena } from "@/src/shared/crypto/hash";
import { crearSesion } from "@/src/shared/auth/sesion";
import { ErrorNoAutenticado } from "@/src/shared/errores/errores";

// POST /api/sesiones (CU transversal). Autentica por correo + contrasena (RNF-02).
export async function iniciarSesion(correo: string, contrasena: string) {
  const u = await prisma.usuario.findUnique({ where: { correo } });
  if (!u || !u.activo || !u.passwordHash) {
    throw new ErrorNoAutenticado("Credenciales invalidas.");
  }
  const ok = await verificarContrasena(contrasena, u.passwordHash);
  if (!ok) throw new ErrorNoAutenticado("Credenciales invalidas.");

  await crearSesion(u.id);
  return { id: u.id, correo: u.correo, nombre: u.nombre, rol: u.rol };
}
