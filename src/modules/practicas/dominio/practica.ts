import { ErrorValidacion } from "@/src/shared/errores/errores";
import { cumpleDuracionMinima, MESES_DURACION_MINIMA } from "@/src/shared/dominio/reglas";

export function validarFormalizacion(params: {
  asesorCorreo: string;
  supervisorCorreo: string;
  fechaInicio: Temporal.PlainDate;
  fechaFin: Temporal.PlainDate;
  tieneConvenio: boolean;
}): void {
  if (params.asesorCorreo.trim().toLowerCase() === params.supervisorCorreo.trim().toLowerCase()) {
    throw new ErrorValidacion("El asesor no puede ser el supervisor de la misma practica (Art. 46).", [
      { campo: "asesorId", error: "El asesor coincide con el supervisor." },
    ]);
  }
  if (!cumpleDuracionMinima(params.fechaInicio.toString(), params.fechaFin.toString())) {
    throw new ErrorValidacion(`La duracion minima es de ${MESES_DURACION_MINIMA} meses (Art. 39).`, [
      { campo: "fechaFin", error: `La duracion minima es de ${MESES_DURACION_MINIMA} meses.` },
    ]);
  }
  if (!params.tieneConvenio) {
    throw new ErrorValidacion("Debe adjuntar el convenio firmado en PDF.", [
      { campo: "convenio", error: "El convenio es obligatorio." },
    ]);
  }
}
