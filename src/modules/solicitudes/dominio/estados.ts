import { EstadoSolicitud } from "@/src/shared/dominio/enums";

// Transiciones validas de la solicitud (Fase 2, Figura 5 / Tabla 9). D12.
export function puedeEnviar(estadoActual: EstadoSolicitud | null): boolean {
  return (
    estadoActual === null ||
    estadoActual === EstadoSolicitud.BORRADOR ||
    estadoActual === EstadoSolicitud.DEVUELTA
  );
}

export function puedeEditarBorrador(estado: EstadoSolicitud): boolean {
  // CU-01 solo permite corregir borradores o solicitudes devueltas (RNF-04).
  return estado === EstadoSolicitud.BORRADOR || estado === EstadoSolicitud.DEVUELTA;
}

export function puedeEvaluar(estado: EstadoSolicitud): boolean {
  return estado === EstadoSolicitud.ENVIADA;
}
