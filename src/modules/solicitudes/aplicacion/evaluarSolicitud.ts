import { prisma } from "@/src/shared/db/prisma";
import { fechaAPrisma } from "@/src/shared/db/fecha";
import { Decision, EstadoSolicitud } from "@/src/shared/dominio/enums";
import { puedeEvaluar } from "../dominio/estados";
import { validarEvaluacion, type DatosEvaluacion } from "../dominio/evaluacion";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import { bus } from "@/src/shared/eventos/bus";
import { TipoEvento } from "@/src/shared/eventos/tipos";
import type {
  SolicitudAprobada,
  SolicitudDevuelta,
  SolicitudRechazada,
} from "@/src/shared/eventos/tipos";
import {
  ErrorNoEncontrado,
  ErrorConflicto,
} from "@/src/shared/errores/errores";

const ESTADO_DESTINO: Record<string, EstadoSolicitud> = {
  [Decision.APROBAR]: EstadoSolicitud.APROBADA,
  [Decision.DEVOLVER]: EstadoSolicitud.DEVUELTA,
  [Decision.RECHAZAR]: EstadoSolicitud.RECHAZADA,
};

// CU-02 pasos 7-10: aprueba, devuelve o rechaza con control de concurrencia
// optimista (D11, E3). La evaluacion se guarda como historial (RN-06).
export async function evaluarSolicitud(
  vicedecanoId: string,
  solicitudId: string,
  version: number,
  datos: DatosEvaluacion,
) {
  validarEvaluacion(datos);
  const destino = ESTADO_DESTINO[datos.decision];

  return prisma.$transaction(async (tx) => {
    const sol = await tx.solicitud.findUnique({ where: { id: solicitudId } });
    if (!sol) throw new ErrorNoEncontrado("Solicitud no encontrada.");
    if (!puedeEvaluar(sol.estado as EstadoSolicitud)) {
      throw new ErrorConflicto(`La solicitud ya no esta "Enviada" (estado actual: ${sol.estado}).`);
    }

    // Si la recomendacion de la Comision pertenece a otra solicitud, se rechaza.
    if (datos.documentoComisionId) {
      const doc = await tx.documentoSolicitud.findUnique({ where: { id: datos.documentoComisionId } });
      if (!doc || doc.solicitudId !== solicitudId) {
        throw new ErrorConflicto("El documento de la Comision no corresponde a esta solicitud.");
      }
    }

    // UPDATE ... WHERE id = ? AND version = ? AND estado = 'ENVIADA' (CU-02 E3).
    const actualizado = await tx.solicitud.updateMany({
      where: { id: solicitudId, version, estado: EstadoSolicitud.ENVIADA },
      data: { estado: destino, version: { increment: 1 } },
    });
    if (actualizado.count === 0) {
      const actual = await tx.solicitud.findUnique({ where: { id: solicitudId } });
      throw new ErrorConflicto(
        `Otro usuario ya decidio sobre esta solicitud (estado actual: ${actual?.estado}).`,
      );
    }

    await tx.evaluacionSolicitud.create({
      data: {
        solicitudId,
        decision: datos.decision,
        asignaturasAprobadas: datos.asignaturasAprobadas,
        indiceMinimo: datos.indiceMinimo,
        documentacionCompleta: datos.documentacionCompleta,
        jefeDepartamento: datos.jefeDepartamento,
        fechaAprobacionJefe: datos.fechaAprobacionJefe
          ? fechaAPrisma(datos.fechaAprobacionJefe)
          : null,
        documentoComisionId: datos.documentoComisionId,
        observaciones: datos.observaciones,
        evaluadoPor: vicedecanoId,
      },
    });

    await registrarAuditoria(tx, {
      usuarioId: vicedecanoId,
      accion: `SOLICITUD_${datos.decision}`,
      entidad: "solicitud",
      entidadId: solicitudId,
    });

    if (datos.decision === Decision.APROBAR) {
      const ev: SolicitudAprobada = { tipo: TipoEvento.SolicitudAprobada, solicitudId, estudianteId: sol.estudianteId };
      await bus.publicar(tx, ev);
    } else if (datos.decision === Decision.DEVOLVER) {
      const ev: SolicitudDevuelta = {
        tipo: TipoEvento.SolicitudDevuelta,
        solicitudId,
        estudianteId: sol.estudianteId,
        observaciones: datos.observaciones ?? "",
      };
      await bus.publicar(tx, ev);
    } else {
      const ev: SolicitudRechazada = {
        tipo: TipoEvento.SolicitudRechazada,
        solicitudId,
        estudianteId: sol.estudianteId,
        motivo: datos.observaciones ?? "",
      };
      await bus.publicar(tx, ev);
    }

    return { id: solicitudId, estado: destino };
  });
}
