import { prisma } from "@/src/shared/db/prisma";
import { Rol, EstadoSolicitud } from "@/src/shared/dominio/enums";
import { ErrorNoEncontrado, ErrorNoAutorizado } from "@/src/shared/errores/errores";
import type { UsuarioSesion } from "@/src/shared/auth/sesion";

// CU-02 pasos 1-2: bandeja de solicitudes "Enviadas", de la mas antigua a la mas reciente.
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
      estudiante: s.estudiante.nombre,
      empresa: s.empresa?.nombre ?? null,
      enviadaEn: s.enviadaEn,
      version: s.version,
    })),
  };
}

// CU-01 GET /mias: lista de solicitudes del estudiante con estado y observaciones.
export async function consultarMias(estudianteId: string) {
  const sols = await prisma.solicitud.findMany({
    where: { estudianteId },
    orderBy: { creadaEn: "desc" },
    include: { evaluaciones: { orderBy: { evaluadoEn: "desc" }, take: 1 } },
  });
  return sols.map((s) => ({
    id: s.id,
    numero: s.numero,
    estado: s.estado,
    version: s.version,
    fechaInicio: s.fechaInicio,
    fechaFin: s.fechaFin,
    observaciones: s.evaluaciones[0]?.observaciones ?? null,
  }));
}

// CU-02 GET /{id}: detalle con documentos y version. Autoriza Vicedecanato o propietario.
export async function obtenerDetalle(actor: UsuarioSesion, solicitudId: string) {
  const s = await prisma.solicitud.findUnique({
    where: { id: solicitudId },
    include: {
      empresa: true,
      asesorSugerido: { select: { id: true, nombre: true, correo: true } },
      documentos: { select: { id: true, tipo: true, nombreOriginal: true, tamanoBytes: true, subidoEn: true } },
      evaluaciones: { orderBy: { evaluadoEn: "desc" } },
    },
  });
  if (!s) throw new ErrorNoEncontrado("Solicitud no encontrada.");
  if (actor.rol !== Rol.VICEDECANATO && s.estudianteId !== actor.id) {
    throw new ErrorNoAutorizado();
  }
  return s;
}
