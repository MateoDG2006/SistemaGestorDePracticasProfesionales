import { prisma } from "@/src/shared/db/prisma";
import { EstadoInvitacion } from "@/src/shared/dominio/enums";
import { invitarSupervisor } from "@/src/modules/identidad/infra/identidadApi";
import { encolarCorreo } from "@/src/modules/notificaciones/infra/encolar";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import { ErrorNoEncontrado, ErrorConflicto } from "@/src/shared/errores/errores";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// CU-03 E4: reenvia la invitacion del supervisor (revoca las pendientes y crea una nueva).
export async function reenviarInvitacion(vicedecanoId: string, practicaId: string) {
  return prisma.$transaction(async (tx) => {
    const practica = await tx.practica.findUnique({ where: { id: practicaId } });
    if (!practica) throw new ErrorNoEncontrado("Practica no encontrada.");
    if (practica.supervisorId) {
      throw new ErrorConflicto("El supervisor ya acepto su acceso.");
    }

    await tx.invitacion.updateMany({
      where: { practicaId, estado: EstadoInvitacion.PENDIENTE },
      data: { estado: EstadoInvitacion.REVOCADA },
    });

    const inv = await invitarSupervisor(tx, practicaId, practica.supervisorCorreo);
    if (inv.tipo !== "INVITADO") {
      throw new ErrorConflicto("El correo del supervisor ya tiene una cuenta.");
    }

    const enlace = `${APP_URL}/invitaciones/${inv.token}`;
    await encolarCorreo(tx, practica.supervisorCorreo, "InvitacionReenviada", {
      mensaje: `Se reenvio su invitacion de supervisor. Acepte su acceso aqui: ${enlace}`,
      practicaId,
      enlace,
    });

    await registrarAuditoria(tx, {
      usuarioId: vicedecanoId,
      accion: "INVITACION_REENVIADA",
      entidad: "practica",
      entidadId: practicaId,
    });

    return { practicaId, estado: "INVITACION_REENVIADA" };
  });
}
