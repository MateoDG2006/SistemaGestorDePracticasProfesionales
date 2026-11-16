import type { EventoDominio } from "./bus";

// Catalogo de eventos internos (Fase 2, Tabla 3). Los publica el modulo
// dueno del cambio; Notificaciones es el unico suscriptor.

export const TipoEvento = {
  SolicitudEnviada: "SolicitudEnviada",
  SolicitudDevuelta: "SolicitudDevuelta",
  SolicitudRechazada: "SolicitudRechazada",
  SolicitudAprobada: "SolicitudAprobada",
  PracticaFormalizada: "PracticaFormalizada",
  PracticaIniciada: "PracticaIniciada",
  InvitacionVencida: "InvitacionVencida",
} as const;

export interface SolicitudEnviada extends EventoDominio {
  tipo: "SolicitudEnviada";
  solicitudId: string;
  numero: string;
  esCorreccion: boolean;
}

export interface SolicitudDevuelta extends EventoDominio {
  tipo: "SolicitudDevuelta";
  solicitudId: string;
  estudianteId: string;
  observaciones: string;
}

export interface SolicitudRechazada extends EventoDominio {
  tipo: "SolicitudRechazada";
  solicitudId: string;
  estudianteId: string;
  motivo: string;
}

export interface SolicitudAprobada extends EventoDominio {
  tipo: "SolicitudAprobada";
  solicitudId: string;
  estudianteId: string;
}

export interface PracticaFormalizada extends EventoDominio {
  tipo: "PracticaFormalizada";
  practicaId: string;
  estudianteId: string;
  asesorId: string;
  supervisorCorreo: string;
  // Si se creo una invitacion nueva, el token en claro va solo aqui (para el correo).
  invitacionToken?: string;
  // Si el supervisor ya tenia cuenta, se vinculo en lugar de invitar (CU-03 A1).
  supervisorVinculadoId?: string;
}

export interface PracticaIniciada extends EventoDominio {
  tipo: "PracticaIniciada";
  practicaId: string;
  estudianteId: string;
  asesorId: string;
}

export interface InvitacionVencida extends EventoDominio {
  tipo: "InvitacionVencida";
  practicaId: string;
  invitacionId: string;
}
