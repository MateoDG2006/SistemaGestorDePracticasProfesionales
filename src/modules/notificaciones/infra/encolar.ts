import type { Tx } from "@/src/shared/db/prisma";
import type { Prisma } from "@prisma/client";

// Escribe una notificacion en plataforma (RF-09) dentro de la transaccion.
export async function notificarEnPlataforma(
  tx: Tx,
  destinatarioId: string,
  tipoEvento: string,
  mensaje: string,
): Promise<void> {
  await tx.notificacion.create({
    data: { destinatarioId, tipoEvento, mensaje },
  });
}

// Encola un correo en el outbox (lo envia el worker, RNF-05). correo_destino
// es obligatorio, por eso solo se encola cuando hay destinatario de correo.
export async function encolarCorreo(
  tx: Tx,
  correoDestino: string,
  tipoEvento: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await tx.mensajeOutbox.create({
    data: { tipoEvento, correoDestino, payload: payload as Prisma.InputJsonValue },
  });
}
