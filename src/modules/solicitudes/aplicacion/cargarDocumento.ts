import { prisma } from "@/src/shared/db/prisma";
import { Rol, EstadoSolicitud, TipoDocumento } from "@/src/shared/dominio/enums";
import { puedeEditarBorrador } from "../dominio/estados";
import { validarPdf } from "@/src/shared/pdf/validadorPdf";
import { guardarArchivo } from "@/src/shared/pdf/almacenArchivos";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import {
  ErrorNoEncontrado,
  ErrorNoAutorizado,
  ErrorConflicto,
  ErrorValidacion,
} from "@/src/shared/errores/errores";
import type { UsuarioSesion } from "@/src/shared/auth/sesion";

export interface ArchivoEntrada {
  tipo: string;
  nombreOriginal: string;
  buffer: Buffer;
  mime?: string;
}

// CU-01 paso 7 (estudiante) y CU-02 paso 6 (Vicedecanato: recomendacion de la Comision).
export async function cargarDocumento(actor: UsuarioSesion, solicitudId: string, archivo: ArchivoEntrada) {
  const sol = await prisma.solicitud.findUnique({ where: { id: solicitudId } });
  if (!sol) throw new ErrorNoEncontrado("Solicitud no encontrada.");

  // Autorizacion por rol y recurso (RNF-01).
  if (actor.rol === Rol.ESTUDIANTE) {
    if (sol.estudianteId !== actor.id) throw new ErrorNoAutorizado();
    if (!puedeEditarBorrador(sol.estado as EstadoSolicitud)) {
      throw new ErrorConflicto("La solicitud no admite cargar documentos en su estado actual.");
    }
    if (archivo.tipo !== TipoDocumento.NOTA_ACEPTACION && archivo.tipo !== TipoDocumento.OTRO) {
      throw new ErrorValidacion("Tipo de documento no permitido para el estudiante.");
    }
  } else if (actor.rol === Rol.VICEDECANATO) {
    if (archivo.tipo !== TipoDocumento.RECOMENDACION_COMISION) {
      throw new ErrorValidacion("El Vicedecanato solo adjunta la recomendacion de la Comision.");
    }
    if (sol.estado !== EstadoSolicitud.ENVIADA) {
      throw new ErrorConflicto("Solo se adjunta la recomendacion a una solicitud enviada.");
    }
  } else {
    throw new ErrorNoAutorizado();
  }

  // Valida tipo real (firma %PDF-) y tamano (RNF-09). El limite de tamano de la
  // peticion se controla ademas en la presentacion.
  validarPdf(archivo.buffer, archivo.mime);

  const guardado = await guardarArchivo(archivo.buffer, `solicitudes/${solicitudId}`);

  // Metadatos del archivo + auditoria en la misma transaccion (RNF-04).
  const doc = await prisma.$transaction(async (tx) => {
    const d = await tx.documentoSolicitud.create({
      data: {
        solicitudId,
        tipo: archivo.tipo,
        nombreOriginal: archivo.nombreOriginal,
        ruta: guardado.ruta,
        hashSha256: guardado.hashSha256,
        tamanoBytes: guardado.tamanoBytes,
      },
    });
    await registrarAuditoria(tx, {
      usuarioId: actor.id,
      accion: "DOCUMENTO_CARGADO",
      entidad: "solicitud",
      entidadId: solicitudId,
      datos: { documentoId: d.id, tipo: archivo.tipo },
    });
    return d;
  });

  return { id: doc.id, tipo: doc.tipo, nombreOriginal: doc.nombreOriginal, tamanoBytes: doc.tamanoBytes };
}
