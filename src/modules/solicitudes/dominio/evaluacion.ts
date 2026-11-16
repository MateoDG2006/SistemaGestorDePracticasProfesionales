import { Decision } from "@/src/shared/dominio/enums";
import { ErrorValidacion, type CampoError } from "@/src/shared/errores/errores";

// Datos de la decision del Vicedecanato (CU-02).
export interface DatosEvaluacion {
  decision: string;
  asignaturasAprobadas: boolean;
  indiceMinimo: boolean;
  documentacionCompleta: boolean;
  jefeDepartamento: string | null;
  fechaAprobacionJefe: Temporal.PlainDate | null;
  documentoComisionId: string | null;
  observaciones: string | null;
}

// Valida la decision segun RN-01 (aprobar) y CU-02 E2 (texto obligatorio).
export function validarEvaluacion(d: DatosEvaluacion): void {
  const campos: CampoError[] = [];

  if (d.decision === Decision.APROBAR) {
    if (!d.asignaturasAprobadas) campos.push({ campo: "asignaturasAprobadas", error: "Debe verificar las asignaturas aprobadas (Art. 41)." });
    if (!d.indiceMinimo) campos.push({ campo: "indiceMinimo", error: "Debe verificar el indice minimo de 1.00 (Art. 41)." });
    if (!d.documentacionCompleta) campos.push({ campo: "documentacionCompleta", error: "Debe verificar la documentacion completa." });
    if (!d.documentoComisionId) campos.push({ campo: "documentoComision", error: "Debe adjuntar la recomendacion de la Comision (Art. 5)." });
    if (!d.jefeDepartamento?.trim()) campos.push({ campo: "jefeDepartamento", error: "Debe registrar el Jefe de Departamento que aprueba." });
    if (!d.fechaAprobacionJefe) campos.push({ campo: "fechaAprobacionJefe", error: "Debe registrar la fecha de aprobacion del Jefe de Departamento." });
  } else if (d.decision === Decision.DEVOLVER || d.decision === Decision.RECHAZAR) {
    if (!d.observaciones?.trim()) {
      campos.push({ campo: "observaciones", error: "Las observaciones o el motivo son obligatorios." });
    }
  } else {
    campos.push({ campo: "decision", error: "Decision invalida." });
  }

  if (campos.length > 0) {
    throw new ErrorValidacion("La evaluacion tiene datos invalidos.", campos);
  }
}
