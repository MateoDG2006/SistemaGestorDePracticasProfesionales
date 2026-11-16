// Valores validos de las columnas varchar+CHECK del esquema.
// Se usan como "enum" tipado en TypeScript sin depender de enums nativos de PG.

export const Rol = {
  ESTUDIANTE: "ESTUDIANTE",
  VICEDECANATO: "VICEDECANATO",
  ASESOR: "ASESOR",
  SUPERVISOR: "SUPERVISOR",
} as const;
export type Rol = (typeof Rol)[keyof typeof Rol];

export const EstadoSolicitud = {
  BORRADOR: "BORRADOR",
  ENVIADA: "ENVIADA",
  DEVUELTA: "DEVUELTA",
  APROBADA: "APROBADA",
  RECHAZADA: "RECHAZADA",
} as const;
export type EstadoSolicitud = (typeof EstadoSolicitud)[keyof typeof EstadoSolicitud];

export const EstadoPractica = {
  POR_INICIAR: "POR_INICIAR",
  EN_CURSO: "EN_CURSO",
} as const;
export type EstadoPractica = (typeof EstadoPractica)[keyof typeof EstadoPractica];

export const Decision = {
  APROBAR: "APROBAR",
  DEVOLVER: "DEVOLVER",
  RECHAZAR: "RECHAZAR",
} as const;
export type Decision = (typeof Decision)[keyof typeof Decision];

export const TipoDocumento = {
  NOTA_ACEPTACION: "NOTA_ACEPTACION",
  RECOMENDACION_COMISION: "RECOMENDACION_COMISION",
  CONVENIO: "CONVENIO",
  OTRO: "OTRO",
} as const;
export type TipoDocumento = (typeof TipoDocumento)[keyof typeof TipoDocumento];

export const EstadoInvitacion = {
  PENDIENTE: "PENDIENTE",
  USADA: "USADA",
  VENCIDA: "VENCIDA",
  REVOCADA: "REVOCADA",
} as const;
export type EstadoInvitacion = (typeof EstadoInvitacion)[keyof typeof EstadoInvitacion];

export const EstadoOutbox = {
  PENDIENTE: "PENDIENTE",
  ENVIADO: "ENVIADO",
  FALLIDO: "FALLIDO",
} as const;
export type EstadoOutbox = (typeof EstadoOutbox)[keyof typeof EstadoOutbox];
