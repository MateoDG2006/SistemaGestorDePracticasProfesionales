import { EstadoPractica } from "@/src/shared/dominio/enums";
import { ErrorValidacion } from "@/src/shared/errores/errores";

// Reglas de dominio de la formalizacion (CU-03).
export function validarFormalizacion(params: {
  asesorCorreo: string;
  supervisorCorreo: string;
  fechaInicio: Temporal.PlainDate;
  fechaFin: Temporal.PlainDate;
  tieneConvenio: boolean;
}): void {
  // RN-04: el asesor no puede ser el supervisor (CU-03 E1).
  if (params.asesorCorreo.trim().toLowerCase() === params.supervisorCorreo.trim().toLowerCase()) {
    throw new ErrorValidacion("El asesor no puede ser el supervisor de la misma practica (Art. 46).", [
      { campo: "asesorId", error: "El asesor coincide con el supervisor." },
    ]);
  }
  // RN-03: duracion minima de 6 meses (CU-03 E3).
  if (Temporal.PlainDate.compare(params.fechaFin, params.fechaInicio.add({ months: 6 })) < 0) {
    throw new ErrorValidacion("La duracion minima es de 6 meses (Art. 39).", [
      { campo: "fechaFin", error: "La duracion minima es de 6 meses." },
    ]);
  }
  // CU-03 E2: convenio firmado obligatorio.
  if (!params.tieneConvenio) {
    throw new ErrorValidacion("Debe adjuntar el convenio firmado en PDF.", [
      { campo: "convenio", error: "El convenio es obligatorio." },
    ]);
  }
}

// CU-03 A2: si la fecha de inicio es futura, la practica queda "Por iniciar".
export function estadoInicial(fechaInicio: Temporal.PlainDate, hoy: Temporal.PlainDate): EstadoPractica {
  return Temporal.PlainDate.compare(fechaInicio, hoy) > 0
    ? EstadoPractica.POR_INICIAR
    : EstadoPractica.EN_CURSO;
}
