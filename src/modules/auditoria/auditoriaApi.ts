import type { Tx } from "@/src/shared/db/prisma";
import type { Prisma } from "@prisma/client";

// Interfaz publica del modulo Auditoria (Fase 2, Tabla 22).
// Registra la accion en la MISMA transaccion que el cambio (RNF-04).
// usuarioId = null representa al usuario SISTEMA (tareas programadas).

export interface EntradaAuditoria {
  usuarioId: string | null;
  accion: string;
  entidad: string;
  entidadId: string;
  datos?: unknown;
}

export async function registrarAuditoria(tx: Tx, e: EntradaAuditoria): Promise<void> {
  await tx.registroAuditoria.create({
    data: {
      usuarioId: e.usuarioId,
      accion: e.accion,
      entidad: e.entidad,
      entidadId: e.entidadId,
      datos: e.datos === undefined ? undefined : (e.datos as Prisma.InputJsonValue),
    },
  });
}
