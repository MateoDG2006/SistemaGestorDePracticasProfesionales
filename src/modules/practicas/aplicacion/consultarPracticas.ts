import { prisma } from "@/src/shared/db/prisma";
import { Rol, TipoDocumento } from "@/src/shared/dominio/enums";
import type { UsuarioSesion } from "@/src/shared/auth/sesion";

function dia(d: Date | null | undefined): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

/** Lista prácticas: todas (Vicedecanato) o solo las del asesor autenticado. */
export async function consultarPracticas(actor: UsuarioSesion) {
  const where = actor.rol === Rol.ASESOR ? { asesorId: actor.id } : {};
  const items = await prisma.practica.findMany({
    where,
    orderBy: { formalizadaEn: "desc" },
    include: {
      estudiante: { select: { nombre: true, correo: true } },
      asesor: { select: { nombre: true } },
      solicitud: { select: { numero: true } },
      periodos: { orderBy: { numero: "asc" } },
      documentos: {
        where: { tipo: TipoDocumento.CONVENIO },
        take: 1,
        select: { id: true, nombreOriginal: true, tamanoBytes: true },
      },
      invitaciones: { orderBy: { venceEn: "desc" }, take: 1 },
    },
  });

  return items.map((p) => {
    const inv = p.invitaciones[0];
    const convenio = p.documentos[0];
    return {
      id: p.id,
      numeroSolicitud: p.solicitud.numero ?? "",
      estado: p.estado,
      estudianteNombre: p.estudiante.nombre,
      estudianteCorreo: p.estudiante.correo,
      asesorNombre: p.asesor.nombre,
      supervisorCorreo: p.supervisorCorreo,
      supervisorVinculado: Boolean(p.supervisorId),
      fechaInicio: dia(p.fechaInicio) ?? "",
      fechaFin: dia(p.fechaFin) ?? "",
      convenio: convenio
        ? {
            id: convenio.id,
            nombreOriginal: convenio.nombreOriginal,
            tamanoBytes: convenio.tamanoBytes,
          }
        : null,
      periodos: p.periodos.map((x) => ({
        numero: x.numero,
        fechaInicio: dia(x.fechaInicio) ?? "",
        fechaCierre: dia(x.fechaCierre) ?? "",
        venceInforme: dia(x.venceInforme) ?? "",
      })),
      invitacion: inv
        ? {
            id: inv.id,
            correoDestino: inv.correoDestino,
            venceEn: inv.venceEn.toISOString(),
            estado: inv.estado,
          }
        : null,
    };
  });
}
