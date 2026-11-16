import { prisma } from "@/src/shared/db/prisma";
import { Rol, EstadoSolicitud, TipoDocumento } from "@/src/shared/dominio/enums";
import { ErrorNoEncontrado, ErrorNoAutorizado } from "@/src/shared/errores/errores";
import type { UsuarioSesion } from "@/src/shared/auth/sesion";

function dia(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

export async function consultarBandeja(pagina = 1, tamano = 20) {
  const skip = Math.max(0, pagina - 1) * tamano;
  const [items, total] = await Promise.all([
    prisma.solicitud.findMany({
      where: { estado: EstadoSolicitud.ENVIADA },
      orderBy: { enviadaEn: "asc" },
      skip,
      take: tamano,
      include: { estudiante: { select: { nombre: true } }, empresa: { select: { nombre: true } } },
    }),
    prisma.solicitud.count({ where: { estado: EstadoSolicitud.ENVIADA } }),
  ]);
  return {
    pagina,
    tamano,
    total,
    items: items.map((s) => ({
      id: s.id,
      numero: s.numero,
      estado: s.estado,
      version: s.version,
      estudianteNombre: s.estudiante.nombre,
      empresaNombre: s.empresa?.nombre ?? "",
      enviadaEn: s.enviadaEn?.toISOString() ?? null,
    })),
  };
}

/** Solicitudes que sugieren a este asesor (aún no formalizadas o en trámite). */
export async function consultarSugeridasParaAsesor(asesorId: string) {
  const sols = await prisma.solicitud.findMany({
    where: {
      asesorSugeridoId: asesorId,
      estado: {
        in: [
          EstadoSolicitud.ENVIADA,
          EstadoSolicitud.DEVUELTA,
          EstadoSolicitud.APROBADA,
          EstadoSolicitud.BORRADOR,
        ],
      },
    },
    orderBy: { creadaEn: "desc" },
    include: {
      estudiante: { select: { nombre: true, correo: true } },
      empresa: { select: { nombre: true } },
      practica: { select: { id: true } },
    },
  });
  return sols.map((s) => ({
    id: s.id,
    numero: s.numero,
    estado: s.estado,
    estudianteNombre: s.estudiante.nombre,
    estudianteCorreo: s.estudiante.correo,
    empresaNombre: s.empresa?.nombre ?? "",
    fechaInicio: dia(s.fechaInicio),
    fechaFin: dia(s.fechaFin),
    formalizada: Boolean(s.practica),
  }));
}

export async function consultarMias(estudianteId: string) {
  const sols = await prisma.solicitud.findMany({
    where: { estudianteId },
    orderBy: { creadaEn: "desc" },
    include: {
      estudiante: { select: { nombre: true, correo: true } },
      empresa: true,
      documentos: { where: { tipo: TipoDocumento.NOTA_ACEPTACION }, take: 1 },
      evaluaciones: { orderBy: { evaluadoEn: "desc" }, take: 1 },
    },
  });
  return sols.map((s) => {
    const nota = s.documentos[0];
    return {
      id: s.id,
      numero: s.numero,
      estado: s.estado,
      version: s.version,
      estudianteNombre: s.estudiante.nombre,
      estudianteCorreo: s.estudiante.correo,
      empresaNombre: s.empresa?.nombre ?? "",
      empresaDireccion: s.empresa?.direccion ?? "",
      supervisorNombre: s.supervisorNombre ?? "",
      supervisorCargo: s.supervisorCargo ?? "",
      supervisorCorreo: s.supervisorCorreo ?? "",
      supervisorTelefono: s.supervisorTelefono ?? "",
      objetivo: s.objetivo ?? "",
      actividades: s.actividades ?? "",
      fechaInicio: dia(s.fechaInicio),
      fechaFin: dia(s.fechaFin),
      asesorSugeridoId: s.asesorSugeridoId,
      consentimientoDatos: s.consentimientoDatos,
      notaAceptacion: nota
        ? { id: nota.id, nombreOriginal: nota.nombreOriginal, tamanoBytes: nota.tamanoBytes }
        : null,
      enviadaEn: s.enviadaEn?.toISOString() ?? null,
      ultimaObservacion: s.evaluaciones[0]?.observaciones ?? null,
    };
  });
}

export async function obtenerDetalle(actor: UsuarioSesion, solicitudId: string) {
  const s = await prisma.solicitud.findUnique({
    where: { id: solicitudId },
    include: {
      estudiante: { select: { nombre: true, correo: true } },
      empresa: true,
      documentos: { select: { id: true, tipo: true, nombreOriginal: true, tamanoBytes: true } },
      evaluaciones: { orderBy: { evaluadoEn: "desc" }, take: 1 },
    },
  });
  if (!s) throw new ErrorNoEncontrado("Solicitud no encontrada.");
  if (actor.rol !== Rol.VICEDECANATO && s.estudianteId !== actor.id) {
    throw new ErrorNoAutorizado();
  }
  const nota = s.documentos.find((d) => d.tipo === TipoDocumento.NOTA_ACEPTACION);
  return {
    id: s.id,
    numero: s.numero,
    estado: s.estado,
    version: s.version,
    estudianteNombre: s.estudiante.nombre,
    estudianteCorreo: s.estudiante.correo,
    empresaNombre: s.empresa?.nombre ?? "",
    empresaDireccion: s.empresa?.direccion ?? "",
    supervisorNombre: s.supervisorNombre ?? "",
    supervisorCargo: s.supervisorCargo ?? "",
    supervisorCorreo: s.supervisorCorreo ?? "",
    supervisorTelefono: s.supervisorTelefono ?? "",
    objetivo: s.objetivo ?? "",
    actividades: s.actividades ?? "",
    fechaInicio: dia(s.fechaInicio),
    fechaFin: dia(s.fechaFin),
    asesorSugeridoId: s.asesorSugeridoId,
    consentimientoDatos: s.consentimientoDatos,
    notaAceptacion: nota
      ? { id: nota.id, nombreOriginal: nota.nombreOriginal, tamanoBytes: nota.tamanoBytes }
      : null,
    enviadaEn: s.enviadaEn?.toISOString() ?? null,
    ultimaObservacion: s.evaluaciones[0]?.observaciones ?? null,
  };
}
