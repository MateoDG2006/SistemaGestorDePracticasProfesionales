// Utilidades de fecha por dia (sin hora), para RN-03 y el calculo de periodos.

export function sumarMeses(fecha: Date, meses: number): Date {
  const d = new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
  const diaOriginal = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + meses);
  // Ajuste de fin de mes (ej. 31 -> ultimo dia del mes destino).
  if (d.getUTCDate() < diaOriginal) d.setUTCDate(0);
  return d;
}

export function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha.getTime());
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
}

// Fecha a medianoche UTC (normaliza columnas DATE).
export function soloFecha(fecha: Date): Date {
  return new Date(Date.UTC(fecha.getUTCFullYear(), fecha.getUTCMonth(), fecha.getUTCDate()));
}

// Verdadero si fin >= inicio + 6 meses (RN-03).
export function cumpleDuracionMinima(inicio: Date, fin: Date): boolean {
  return soloFecha(fin).getTime() >= sumarMeses(soloFecha(inicio), 6).getTime();
}
