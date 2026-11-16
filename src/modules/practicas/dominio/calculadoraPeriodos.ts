import { sumarMeses, sumarDias, soloFecha } from "@/src/shared/fechas";

export interface PeriodoCalculado {
  numero: number;
  fechaInicio: Date;
  fechaCierre: Date;
  venceInforme: Date;
}

// CalculadoraPeriodos (Fase 2, seccion 4.6): genera los 6 periodos mensuales y
// sus vencimientos al formalizar. Para el periodo i (1..6):
//  - inicio  = fechaInicio + (i-1) meses
//  - cierre  = dia anterior al inicio del periodo siguiente; el 6o cierra en fechaFin
//  - vence   = cierre + 15 dias (RN-05)
export function generarPeriodos(fechaInicio: Date, fechaFin: Date): PeriodoCalculado[] {
  const inicio = soloFecha(fechaInicio);
  const fin = soloFecha(fechaFin);
  const periodos: PeriodoCalculado[] = [];

  for (let i = 1; i <= 6; i++) {
    const fInicio = sumarMeses(inicio, i - 1);
    const fCierre = i < 6 ? sumarDias(sumarMeses(inicio, i), -1) : fin;
    const vence = sumarDias(fCierre, 15);
    periodos.push({ numero: i, fechaInicio: fInicio, fechaCierre: fCierre, venceInforme: vence });
  }
  return periodos;
}
