// DTOs del frontend, alineados con el contrato REST de la Fase 2 (Tabla 20) y
// con los enums del dominio en src/shared/dominio/enums.ts.
// El backend es la fuente de verdad; estos tipos describen lo que la UI
// consume y envía.

import type {
  Decision,
  EstadoInvitacion,
  EstadoPractica,
  EstadoSolicitud,
  Rol,
} from "@/src/shared/dominio/enums";

export type { Decision, EstadoInvitacion, EstadoPractica, EstadoSolicitud, Rol };

export interface Usuario {
  id: string;
  correo: string;
  nombre: string;
  rol: Rol;
}

export interface Docente {
  id: string;
  nombre: string;
  correo: string;
}

export interface DocumentoRef {
  id: string;
  nombreOriginal: string;
  tamanoBytes: number;
}

export interface Solicitud {
  id: string;
  numero: string | null;
  estado: EstadoSolicitud;
  version: number;

  estudianteNombre: string;
  estudianteCorreo: string;
  cedula?: string;
  carrera?: string;

  empresaNombre: string;
  empresaDireccion: string;

  supervisorNombre: string;
  supervisorCargo: string;
  supervisorCorreo: string;
  supervisorTelefono: string;

  objetivo: string;
  actividades: string;
  fechaInicio: string | null; // YYYY-MM-DD
  fechaFin: string | null;
  asesorSugeridoId: string | null;

  consentimientoDatos: boolean;

  notaAceptacion: DocumentoRef | null;
  enviadaEn: string | null;

  // Última evaluación conocida (para mostrar observaciones de devolución).
  ultimaObservacion?: string | null;
}

// Cuerpo para crear/actualizar una solicitud (CU-01).
export interface SolicitudInput {
  empresaNombre: string;
  empresaDireccion: string;
  supervisorNombre: string;
  supervisorCargo: string;
  supervisorCorreo: string;
  supervisorTelefono: string;
  objetivo: string;
  actividades: string;
  fechaInicio: string;
  fechaFin: string;
  asesorSugeridoId: string | null;
  consentimientoDatos: boolean;
}

// Cuerpo de una decisión de evaluación (CU-02).
export interface EvaluacionInput {
  decision: Decision;
  version: number; // control de concurrencia optimista (CU-02 E3)
  asignaturasAprobadas: boolean;
  indiceMinimo: boolean;
  documentacionCompleta: boolean;
  jefeDepartamento: string;
  fechaAprobacionJefe: string;
  documentoComisionId: string | null;
  observaciones: string;
}

export interface Periodo {
  numero: number;
  fechaInicio: string;
  fechaCierre: string;
  venceInforme: string;
}

export interface Invitacion {
  id: string;
  correoDestino: string;
  venceEn: string; // ISO
  estado: EstadoInvitacion;
}

export interface Practica {
  id: string;
  numeroSolicitud: string;
  estado: EstadoPractica;
  estudianteNombre: string;
  asesorNombre: string;
  supervisorCorreo: string;
  supervisorVinculado: boolean;
  fechaInicio: string;
  fechaFin: string;
  convenio: DocumentoRef | null;
  periodos: Periodo[];
  invitacion: Invitacion | null;
}

export interface PracticaInput {
  solicitudId: string;
  asesorId: string;
  supervisorCorreo: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface Notificacion {
  id: string;
  tipoEvento: string;
  mensaje: string;
  leida: boolean;
  creadaEn: string;
  estadoOutbox?: string;
}

export interface Auditoria {
  id: number;
  usuario: string;
  accion: string;
  entidad: string;
  ocurridoEn: string;
}
