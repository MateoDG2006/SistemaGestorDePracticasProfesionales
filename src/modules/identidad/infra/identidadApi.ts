import type { Tx } from "@/src/shared/db/prisma";
import { prisma } from "@/src/shared/db/prisma";
import { generarToken } from "@/src/shared/crypto/hash";
import { relojSistema, type Reloj } from "@/src/shared/reloj";
import { Rol, EstadoInvitacion } from "@/src/shared/dominio/enums";
import { INVITACION_TTL_HORAS, venceInvitacion } from "@/src/shared/dominio/reglas";

const TTL_HORAS = Number(process.env.INVITACION_TTL_HORAS ?? INVITACION_TTL_HORAS);

export interface DocenteDto {
  id: string;
  nombre: string;
  correo: string;
}

// IdentidadApi.obtenerDocente (Tabla 22): valida RN-04 y permite notificar al asesor.
export async function obtenerDocente(id: string): Promise<DocenteDto | null> {
  const u = await prisma.usuario.findFirst({ where: { id, rol: Rol.ASESOR, activo: true } });
  return u ? { id: u.id, nombre: u.nombre, correo: u.correo } : null;
}

export async function listarDocentes(): Promise<DocenteDto[]> {
  const us = await prisma.usuario.findMany({
    where: { rol: Rol.ASESOR, activo: true },
    orderBy: { nombre: "asc" },
  });
  return us.map((u) => ({ id: u.id, nombre: u.nombre, correo: u.correo }));
}

export type ResultadoInvitacion =
  | { tipo: "VINCULADO"; supervisorId: string }
  | { tipo: "INVITADO"; token: string };

// IdentidadApi.invitarSupervisor (Tabla 22 / CU-03 A1): si el correo ya tiene
// cuenta, la vincula; si no, crea una invitacion de un solo uso (72 h).
// Debe llamarse DESPUES de crear la practica (la invitacion referencia practica_id).
export async function invitarSupervisor(
  tx: Tx,
  practicaId: string,
  correo: string,
  reloj: Reloj = relojSistema,
): Promise<ResultadoInvitacion> {
  const existente = await tx.usuario.findUnique({ where: { correo } });
  if (existente) {
    return { tipo: "VINCULADO", supervisorId: existente.id };
  }
  const { token, hash } = generarToken();
  const venceEn = venceInvitacion(reloj.ahora(), TTL_HORAS);
  await tx.invitacion.create({
    data: {
      practicaId,
      correoDestino: correo,
      hashToken: hash,
      venceEn,
      estado: EstadoInvitacion.PENDIENTE,
    },
  });
  return { tipo: "INVITADO", token };
}
