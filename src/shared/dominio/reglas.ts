import {
  Decision,
  EstadoPractica,
  EstadoSolicitud,
  Rol,
} from "@/src/shared/dominio/enums";

export const MESES_DURACION_MINIMA = 6;
export const CANTIDAD_PERIODOS = 6;
export const DIAS_VENCIMIENTO_INFORME = 15;
export const INVITACION_TTL_HORAS = 72;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MIME_PDF = "application/pdf";

export const PARAM_SIN_FORMALIZAR = "sinFormalizar";

export const TipoEvento = {
  SolicitudEnviada: "SolicitudEnviada",
  SolicitudDevuelta: "SolicitudDevuelta",
  SolicitudRechazada: "SolicitudRechazada",
  SolicitudAprobada: "SolicitudAprobada",
  PracticaFormalizada: "PracticaFormalizada",
  PracticaIniciada: "PracticaIniciada",
  InvitacionVencida: "InvitacionVencida",
} as const;

export type TipoEvento = (typeof TipoEvento)[keyof typeof TipoEvento];

const EFECTO_DECISION = {
  [Decision.APROBAR]: { estado: EstadoSolicitud.APROBADA, evento: TipoEvento.SolicitudAprobada },
  [Decision.DEVOLVER]: { estado: EstadoSolicitud.DEVUELTA, evento: TipoEvento.SolicitudDevuelta },
  [Decision.RECHAZAR]: { estado: EstadoSolicitud.RECHAZADA, evento: TipoEvento.SolicitudRechazada },
} as const;

export type EfectoDecision = (typeof EFECTO_DECISION)[Decision];

export function efectoDecision(decision: string): EfectoDecision | null {
  if (decision in EFECTO_DECISION) return EFECTO_DECISION[decision as Decision];
  return null;
}

export function solicitudEditable(estado: string): boolean {
  return estado === EstadoSolicitud.BORRADOR || estado === EstadoSolicitud.DEVUELTA;
}

export function puedeEvaluar(estado: string): boolean {
  return estado === EstadoSolicitud.ENVIADA;
}

export function solicitudActiva(estado: string): boolean {
  return estado !== EstadoSolicitud.RECHAZADA;
}

export function impideCrearSolicitud(estado: string): boolean {
  return estado === EstadoSolicitud.ENVIADA || estado === EstadoSolicitud.APROBADA;
}

export function pasoDeSolicitud(estado: string | undefined): number {
  if (estado === EstadoSolicitud.BORRADOR) return 0;
  if (estado === EstadoSolicitud.ENVIADA || estado === EstadoSolicitud.DEVUELTA) return 1;
  if (estado === EstadoSolicitud.APROBADA) return 2;
  return 0;
}

export const RUTA_INICIO: Record<Rol, string> = {
  ESTUDIANTE: "/estudiante",
  VICEDECANATO: "/vicedecanato",
  SUPERVISOR: "/supervisor",
  ASESOR: "/vicedecanato",
};

export function textoDuracionMinima(): string {
  return `Duración mínima: ${MESES_DURACION_MINIMA} meses (RN-03).`;
}

export function textoVencimientoInvitacion(): string {
  return `${INVITACION_TTL_HORAS} h`;
}

export function textoLimitePdf(): string {
  return `${MAX_PDF_BYTES / (1024 * 1024)} MB`;
}

export function textoPeriodos(): string {
  return `${CANTIDAD_PERIODOS} períodos`;
}

export function sumarMeses(iso: string, meses: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  dt.setUTCMonth(dt.getUTCMonth() + meses);
  const ultimo = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
  dt.setUTCDate(Math.min(d, ultimo));
  return dt.toISOString().slice(0, 10);
}

export function sumarDias(iso: string, dias: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + dias);
  return dt.toISOString().slice(0, 10);
}

export function cumpleDuracionMinima(inicio: string, fin: string): boolean {
  return Boolean(inicio && fin && fin >= sumarMeses(inicio, MESES_DURACION_MINIMA));
}

export interface PeriodoCalculado {
  numero: number;
  fechaInicio: string;
  fechaCierre: string;
  venceInforme: string;
}

export function generarPeriodos(inicio: string, fin: string): PeriodoCalculado[] {
  const periodos: PeriodoCalculado[] = [];
  for (let i = 1; i <= CANTIDAD_PERIODOS; i++) {
    const fechaInicio = sumarMeses(inicio, i - 1);
    const fechaCierre = i < CANTIDAD_PERIODOS ? sumarDias(sumarMeses(inicio, i), -1) : fin;
    periodos.push({
      numero: i,
      fechaInicio,
      fechaCierre,
      venceInforme: sumarDias(fechaCierre, DIAS_VENCIMIENTO_INFORME),
    });
  }
  return periodos;
}

export function estadoInicialPractica(fechaInicio: string, hoy: string): EstadoPractica {
  return fechaInicio > hoy ? EstadoPractica.POR_INICIAR : EstadoPractica.EN_CURSO;
}

export function venceInvitacion(desde: Date, horas = INVITACION_TTL_HORAS): Date {
  return new Date(desde.getTime() + horas * 3_600_000);
}

export function enlaceInvitacion(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/$/, "")}/invitaciones/${token}`;
}

export function excedePdf(tamanoBytes: number): boolean {
  return tamanoBytes > MAX_PDF_BYTES;
}

export function mimePdfInvalido(mime?: string | null): boolean {
  return Boolean(mime && mime !== MIME_PDF);
}
