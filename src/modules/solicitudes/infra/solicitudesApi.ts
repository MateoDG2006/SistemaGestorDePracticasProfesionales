import { prisma } from "@/src/shared/db/prisma";
import { EstadoSolicitud } from "@/src/shared/dominio/enums";

// SolicitudesApi (Fase 2, Tabla 22): datos para que Practicas formalice sin
// leer tablas ajenas directamente.
export interface SolicitudAprobadaDto {
  id: string;
  estudianteId: string;
  asesorSugeridoId: string | null;
  supervisorNombre: string;
  supervisorCorreo: string;
  fechaInicio: Date;
  fechaFin: Date;
}

export async function obtenerAprobada(id: string): Promise<SolicitudAprobadaDto | null> {
  const s = await prisma.solicitud.findFirst({ where: { id, estado: EstadoSolicitud.APROBADA } });
  if (!s) return null;
  return {
    id: s.id,
    estudianteId: s.estudianteId,
    asesorSugeridoId: s.asesorSugeridoId,
    supervisorNombre: s.supervisorNombre ?? "",
    supervisorCorreo: s.supervisorCorreo ?? "",
    fechaInicio: s.fechaInicio!,
    fechaFin: s.fechaFin!,
  };
}

export async function listarAprobadasSinFormalizar() {
  const sols = await prisma.solicitud.findMany({
    where: { estado: EstadoSolicitud.APROBADA, practica: null },
    orderBy: { enviadaEn: "asc" },
    include: { estudiante: { select: { nombre: true } }, empresa: { select: { nombre: true } } },
  });
  return sols.map((s) => ({
    id: s.id,
    numero: s.numero,
    estudiante: s.estudiante.nombre,
    empresa: s.empresa?.nombre ?? null,
    supervisorCorreo: s.supervisorCorreo,
    asesorSugeridoId: s.asesorSugeridoId,
    fechaInicio: s.fechaInicio,
    fechaFin: s.fechaFin,
  }));
}
