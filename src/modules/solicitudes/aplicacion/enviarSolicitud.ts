import { prisma, type Tx } from "@/src/shared/db/prisma";
import { fechaDePrismaOpcional } from "@/src/shared/db/fecha";
import { Rol, EstadoSolicitud, TipoDocumento } from "@/src/shared/dominio/enums";
import { solicitudEditable } from "@/src/shared/dominio/reglas";
import { validarEnviable } from "../dominio/solicitud";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import { bus } from "@/src/shared/eventos/bus";
import { TipoEvento, type SolicitudEnviada } from "@/src/shared/eventos/tipos";
import { relojSistema } from "@/src/shared/reloj";
import {
  ErrorNoEncontrado,
  ErrorNoAutorizado,
  ErrorConflicto,
} from "@/src/shared/errores/errores";

async function siguienteNumero(tx: Tx, anio: number): Promise<string> {
  const prefijo = `SOL-${anio}-`;
  const n = await tx.solicitud.count({ where: { numero: { startsWith: prefijo } } });
  return `${prefijo}${String(n + 1).padStart(4, "0")}`;
}

// CU-01 pasos 9-11: valida, registra "Enviada" con numero y notifica al Vicedecanato.
export async function enviarSolicitud(solicitudId: string, estudianteId: string) {
  const ahora = relojSistema.ahora();

  return prisma.$transaction(async (tx) => {
    const sol = await tx.solicitud.findUnique({ where: { id: solicitudId } });
    if (!sol) throw new ErrorNoEncontrado("Solicitud no encontrada.");
    if (sol.estudianteId !== estudianteId) throw new ErrorNoAutorizado();
    if (!solicitudEditable(sol.estado)) {
      throw new ErrorConflicto("La solicitud no puede enviarse en su estado actual.");
    }

    const notas = await tx.documentoSolicitud.count({
      where: { solicitudId, tipo: TipoDocumento.NOTA_ACEPTACION },
    });

    let asesorCorreo: string | null = null;
    if (sol.asesorSugeridoId) {
      const asesor = await tx.usuario.findFirst({
        where: { id: sol.asesorSugeridoId, rol: Rol.ASESOR },
      });
      asesorCorreo = asesor?.correo ?? null;
    }

    validarEnviable({
      empresaId: sol.empresaId,
      supervisorNombre: sol.supervisorNombre,
      supervisorCargo: sol.supervisorCargo,
      supervisorCorreo: sol.supervisorCorreo,
      supervisorTelefono: sol.supervisorTelefono,
      objetivo: sol.objetivo,
      actividades: sol.actividades,
      fechaInicio: fechaDePrismaOpcional(sol.fechaInicio),
      fechaFin: fechaDePrismaOpcional(sol.fechaFin),
      consentimientoDatos: sol.consentimientoDatos,
      tieneNotaAceptacion: notas > 0,
      asesorCorreo,
    });

    const esCorreccion = sol.estado === EstadoSolicitud.DEVUELTA;
    const numero = sol.numero ?? (await siguienteNumero(tx, ahora.getUTCFullYear()));

    const actualizado = await tx.solicitud.updateMany({
      where: { id: solicitudId, version: sol.version },
      data: {
        estado: EstadoSolicitud.ENVIADA,
        numero,
        enviadaEn: ahora,
        consentimientoEn: ahora,
        version: { increment: 1 },
      },
    });
    if (actualizado.count === 0) {
      throw new ErrorConflicto("La solicitud fue modificada por otra operacion. Recargue.");
    }

    await registrarAuditoria(tx, {
      usuarioId: estudianteId,
      accion: esCorreccion ? "SOLICITUD_REENVIADA" : "SOLICITUD_ENVIADA",
      entidad: "solicitud",
      entidadId: solicitudId,
      datos: { numero },
    });

    const evento: SolicitudEnviada = {
      tipo: TipoEvento.SolicitudEnviada,
      solicitudId,
      numero,
      esCorreccion,
    };
    await bus.publicar(tx, evento);

    return { id: solicitudId, numero, estado: EstadoSolicitud.ENVIADA };
  });
}
