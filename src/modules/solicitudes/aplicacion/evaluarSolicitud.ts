import { prisma } from "@/src/shared/db/prisma";
import { fechaAPrisma } from "@/src/shared/db/fecha";
import { EstadoSolicitud } from "@/src/shared/dominio/enums";
import { efectoDecision, puedeEvaluar, TipoEvento } from "@/src/shared/dominio/reglas";
import { validarEvaluacion, type DatosEvaluacion } from "../dominio/evaluacion";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import { bus } from "@/src/shared/eventos/bus";
import type {
  SolicitudAprobada,
  SolicitudDevuelta,
  SolicitudRechazada,
} from "@/src/shared/eventos/tipos";
import {
  ErrorNoEncontrado,
  ErrorConflicto,
} from "@/src/shared/errores/errores";

export async function evaluarSolicitud(
  vicedecanoId: string,
  solicitudId: string,
  version: number,
  datos: DatosEvaluacion,
) {
  validarEvaluacion(datos);
  const efecto = efectoDecision(datos.decision);
  if (!efecto) {
    throw new ErrorConflicto("Decision invalida.");
  }
  const destino = efecto.estado;

  return prisma.$transaction(async (tx) => {
    const sol = await tx.solicitud.findUnique({ where: { id: solicitudId } });
    if (!sol) throw new ErrorNoEncontrado("Solicitud no encontrada.");
    if (!puedeEvaluar(sol.estado as EstadoSolicitud)) {
      throw new ErrorConflicto(`La solicitud ya no esta "Enviada" (estado actual: ${sol.estado}).`);
    }

    if (datos.documentoComisionId) {
      const doc = await tx.documentoSolicitud.findUnique({ where: { id: datos.documentoComisionId } });
      if (!doc || doc.solicitudId !== solicitudId) {
        throw new ErrorConflicto("El documento de la Comision no corresponde a esta solicitud.");
      }
    }

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

    if (efecto.evento === TipoEvento.SolicitudAprobada) {
      const ev: SolicitudAprobada = { tipo: efecto.evento, solicitudId, estudianteId: sol.estudianteId };
      await bus.publicar(tx, ev);
    } else if (efecto.evento === TipoEvento.SolicitudDevuelta) {
      const ev: SolicitudDevuelta = {
        tipo: efecto.evento,
        solicitudId,
        estudianteId: sol.estudianteId,
        observaciones: datos.observaciones ?? "",
      };
      await bus.publicar(tx, ev);
    } else {
      const ev: SolicitudRechazada = {
        tipo: efecto.evento,
        solicitudId,
        estudianteId: sol.estudianteId,
        motivo: datos.observaciones ?? "",
      };
      await bus.publicar(tx, ev);
    }

    return { id: solicitudId, estado: destino };
  });
}
