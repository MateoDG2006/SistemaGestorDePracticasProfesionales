import { ErrorValidacion, type CampoError } from "@/src/shared/errores/errores";
import { cumpleDuracionMinima, MESES_DURACION_MINIMA } from "@/src/shared/dominio/reglas";

export interface DatosEnviable {
  empresaId: string | null;
  supervisorNombre: string | null;
  supervisorCargo: string | null;
  supervisorCorreo: string | null;
  supervisorTelefono: string | null;
  objetivo: string | null;
  actividades: string | null;
  fechaInicio: Temporal.PlainDate | null;
  fechaFin: Temporal.PlainDate | null;
  consentimientoDatos: boolean;
  tieneNotaAceptacion: boolean;
  asesorCorreo: string | null;
}

export function validarEnviable(d: DatosEnviable): void {
  const campos: CampoError[] = [];
  const req = (valor: unknown, campo: string, etiqueta: string) => {
    if (valor === null || valor === undefined || (typeof valor === "string" && valor.trim() === "")) {
      campos.push({ campo, error: `${etiqueta} es obligatorio.` });
    }
  };

  req(d.empresaId, "empresaNombre", "Los datos de la empresa");
  req(d.supervisorNombre, "supervisorNombre", "El nombre del supervisor");
  req(d.supervisorCargo, "supervisorCargo", "El cargo del supervisor");
  req(d.supervisorCorreo, "supervisorCorreo", "El correo del supervisor");
  req(d.supervisorTelefono, "supervisorTelefono", "El telefono del supervisor");
  req(d.objetivo, "objetivo", "El objetivo del programa");
  req(d.actividades, "actividades", "Las actividades del programa");
  req(d.fechaInicio, "fechaInicio", "La fecha de inicio");
  req(d.fechaFin, "fechaFin", "La fecha de fin");

  if (!d.consentimientoDatos) {
    campos.push({ campo: "consentimientoDatos", error: "Debe aceptar el tratamiento de datos personales." });
  }

  if (!d.tieneNotaAceptacion) {
    campos.push({ campo: "notaAceptacion", error: "Debe adjuntar la nota de aceptacion de la empresa en PDF." });
  }

  if (
    d.fechaInicio &&
    d.fechaFin &&
    !cumpleDuracionMinima(d.fechaInicio.toString(), d.fechaFin.toString())
  ) {
    campos.push({
      campo: "fechaFin",
      error: `La duracion minima es de ${MESES_DURACION_MINIMA} meses (Art. 39).`,
    });
  }

  if (
    d.supervisorCorreo &&
    d.asesorCorreo &&
    d.supervisorCorreo.trim().toLowerCase() === d.asesorCorreo.trim().toLowerCase()
  ) {
    campos.push({ campo: "supervisorCorreo", error: "El supervisor no puede ser el asesor sugerido (Art. 46)." });
  }

  if (campos.length > 0) {
    throw new ErrorValidacion("La solicitud tiene datos invalidos.", campos);
  }
}
