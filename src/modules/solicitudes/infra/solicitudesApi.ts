import { prisma } from "@/src/shared/db/prisma";
import { fechaDePrisma } from "@/src/shared/db/fecha";
import { EstadoSolicitud } from "@/src/shared/dominio/enums";

// SolicitudesApi (Fase 2, Tabla 22): datos para que Practicas formalice sin
// leer tablas ajenas directamente.
export interface SolicitudAprobadaDto {
  id: string;
  estudianteId: string;
  asesorSugeridoId: string | null;
  supervisorNombre: string;
  supervisorCorreo: string;
  fechaInicio: Temporal.PlainDate;
  fechaFin: Temporal.PlainDate;
}

export async function obtenerAprobada(id: string): Promise<SolicitudAprobadaDto | null> {
  const s = await prisma.solicitud.findFirst({ where: { id, estado: EstadoSolicitud.APROBADA } });
  if (!s || !s.fechaInicio || !s.fechaFin) return null;
  return {
    id: s.id,
    estudianteId: s.estudianteId,
    asesorSugeridoId: s.asesorSugeridoId,
    supervisorNombre: s.supervisorNombre ?? "",
    supervisorCorreo: s.supervisorCorreo ?? "",
    fechaInicio: fechaDePrisma(s.fechaInicio),
    fechaFin: fechaDePrisma(s.fechaFin),
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
    estado: s.estado,
    estudianteNombre: s.estudiante.nombre,
    empresaNombre: s.empresa?.nombre ?? "",
    supervisorCorreo: s.supervisorCorreo ?? "",
    asesorSugeridoId: s.asesorSugeridoId,
    fechaInicio: s.fechaInicio ? s.fechaInicio.toISOString().slice(0, 10) : null,
    fechaFin: s.fechaFin ? s.fechaFin.toISOString().slice(0, 10) : null,
  }));
}
