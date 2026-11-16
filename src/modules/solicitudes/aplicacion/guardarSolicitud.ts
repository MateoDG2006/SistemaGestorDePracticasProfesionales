import { prisma, type Tx } from "@/src/shared/db/prisma";
import { fechaAPrisma } from "@/src/shared/db/fecha";
import { EstadoSolicitud } from "@/src/shared/dominio/enums";
import { puedeEditarBorrador } from "../dominio/estados";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import {
  ErrorConflicto,
  ErrorNoEncontrado,
  ErrorNoAutorizado,
} from "@/src/shared/errores/errores";

export interface EmpresaInput {
  nombre: string;
  ruc?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
}

export interface SolicitudInput {
  empresa?: EmpresaInput | null;
  supervisorNombre?: string | null;
  supervisorCargo?: string | null;
  supervisorCorreo?: string | null;
  supervisorTelefono?: string | null;
  objetivo?: string | null;
  actividades?: string | null;
  fechaInicio?: Temporal.PlainDate | null;
  fechaFin?: Temporal.PlainDate | null;
  asesorSugeridoId?: string | null;
  consentimientoDatos?: boolean;
}

function esUnicidad(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

async function resolverEmpresaId(tx: Tx, empresa?: EmpresaInput | null): Promise<string | null> {
  if (!empresa?.nombre?.trim()) return null;
  const ruc = empresa.ruc?.trim() || null;
  const existente = await tx.empresa.findFirst({ where: { nombre: empresa.nombre, ruc } });
  if (existente) return existente.id;
  const creada = await tx.empresa.create({
    data: {
      nombre: empresa.nombre,
      ruc,
      direccion: empresa.direccion ?? null,
      telefono: empresa.telefono ?? null,
      correo: empresa.correo ?? null,
    },
  });
  return creada.id;
}

function camposSolicitud(input: SolicitudInput, empresaId: string | null) {
  return {
    ...(empresaId !== null ? { empresaId } : {}),
    supervisorNombre: input.supervisorNombre ?? null,
    supervisorCargo: input.supervisorCargo ?? null,
    supervisorCorreo: input.supervisorCorreo ?? null,
    supervisorTelefono: input.supervisorTelefono ?? null,
    objetivo: input.objetivo ?? null,
    actividades: input.actividades ?? null,
    fechaInicio: input.fechaInicio ? fechaAPrisma(input.fechaInicio) : null,
    fechaFin: input.fechaFin ? fechaAPrisma(input.fechaFin) : null,
    asesorSugeridoId: input.asesorSugeridoId ?? null,
    consentimientoDatos: input.consentimientoDatos ?? false,
  };
}

// CU-01: crea una solicitud en estado BORRADOR (RN-02 via indice unico parcial).
export async function crearBorrador(estudianteId: string, input: SolicitudInput) {
  try {
    return await prisma.$transaction(async (tx) => {
      const empresaId = await resolverEmpresaId(tx, input.empresa);
      const sol = await tx.solicitud.create({
        data: {
          estudianteId,
          estado: EstadoSolicitud.BORRADOR,
          ...camposSolicitud(input, empresaId),
        },
      });
      await registrarAuditoria(tx, {
        usuarioId: estudianteId,
        accion: "SOLICITUD_BORRADOR_CREADA",
        entidad: "solicitud",
        entidadId: sol.id,
      });
      return sol;
    });
  } catch (e) {
    if (esUnicidad(e)) {
      throw new ErrorConflicto("Ya tiene una solicitud o practica en tramite (RN-02).");
    }
    throw e;
  }
}

// CU-01 A1/A2: actualiza un borrador o una solicitud devuelta (control por version).
export async function actualizarBorrador(
  solicitudId: string,
  estudianteId: string,
  version: number,
  input: SolicitudInput,
) {
  return prisma.$transaction(async (tx) => {
    const sol = await tx.solicitud.findUnique({ where: { id: solicitudId } });
    if (!sol) throw new ErrorNoEncontrado("Solicitud no encontrada.");
    if (sol.estudianteId !== estudianteId) throw new ErrorNoAutorizado();
    if (!puedeEditarBorrador(sol.estado as EstadoSolicitud)) {
      throw new ErrorConflicto("La solicitud no puede editarse en su estado actual.");
    }

    const empresaId = await resolverEmpresaId(tx, input.empresa);
    const actualizado = await tx.solicitud.updateMany({
      where: { id: solicitudId, version },
      data: { ...camposSolicitud(input, empresaId), version: { increment: 1 } },
    });
    if (actualizado.count === 0) {
      throw new ErrorConflicto("La solicitud fue modificada por otra operacion. Recargue.");
    }
    return tx.solicitud.findUnique({ where: { id: solicitudId } });
  });
}
