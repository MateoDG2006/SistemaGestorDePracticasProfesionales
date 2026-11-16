import { prisma } from "@/src/shared/db/prisma";
import { EstadoInvitacion } from "@/src/shared/dominio/enums";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import { bus } from "@/src/shared/eventos/bus";
import { TipoEvento, type InvitacionVencida } from "@/src/shared/eventos/tipos";

// VencerInvitacionesJob (4.7, cada hora): marca como vencidas las invitaciones
// sin usar tras 72 h y avisa al Vicedecanato para reenviarlas (CU-03 E4).
export async function vencerInvitaciones(): Promise<number> {
  const ahora = new Date();
  const vencidas = await prisma.invitacion.findMany({
    where: { estado: EstadoInvitacion.PENDIENTE, venceEn: { lte: ahora } },
  });

  let total = 0;
  for (const inv of vencidas) {
    await prisma.$transaction(async (tx) => {
      const r = await tx.invitacion.updateMany({
        where: { id: inv.id, estado: EstadoInvitacion.PENDIENTE },
        data: { estado: EstadoInvitacion.VENCIDA },
      });
      if (r.count === 0) return;
      await registrarAuditoria(tx, {
        usuarioId: null,
        accion: "INVITACION_VENCIDA",
        entidad: "invitacion",
        entidadId: inv.id,
      });
      const ev: InvitacionVencida = {
        tipo: TipoEvento.InvitacionVencida,
        practicaId: inv.practicaId,
        invitacionId: inv.id,
      };
      await bus.publicar(tx, ev);
      total++;
    });
  }
  return total;
}
