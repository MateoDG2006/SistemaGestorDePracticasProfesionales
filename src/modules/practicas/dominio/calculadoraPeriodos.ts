export interface PeriodoCalculado {
  numero: number;
  fechaInicio: Temporal.PlainDate;
  fechaCierre: Temporal.PlainDate;
  venceInforme: Temporal.PlainDate;
}

// CalculadoraPeriodos (Fase 2, seccion 4.6): genera los 6 periodos mensuales y
// sus vencimientos al formalizar. Para el periodo i (1..6):
//  - inicio  = fechaInicio + (i-1) meses
//  - cierre  = dia anterior al inicio del periodo siguiente; el 6o cierra en fechaFin
//  - vence   = cierre + 15 dias (RN-05)
export function generarPeriodos(
  fechaInicio: Temporal.PlainDate,
  fechaFin: Temporal.PlainDate,
): PeriodoCalculado[] {
  const periodos: PeriodoCalculado[] = [];

  for (let i = 1; i <= 6; i++) {
    const fInicio = fechaInicio.add({ months: i - 1 });
    const fCierre = i < 6 ? fechaInicio.add({ months: i }).subtract({ days: 1 }) : fechaFin;
    const vence = fCierre.add({ days: 15 });
    periodos.push({ numero: i, fechaInicio: fInicio, fechaCierre: fCierre, venceInforme: vence });
  }
  return periodos;
}
