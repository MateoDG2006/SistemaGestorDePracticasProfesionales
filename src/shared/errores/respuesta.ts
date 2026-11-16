import { AppError } from "./errores";

interface CuerpoError {
  codigo: string;
  mensaje: string;
  campos?: { campo: string; error: string }[];
}

// Convierte cualquier excepcion en una Response JSON con el formato comun.
export function respuestaDeError(e: unknown): Response {
  if (e instanceof AppError) {
    const cuerpo: CuerpoError = { codigo: e.codigo, mensaje: e.message };
    if (e.campos && e.campos.length > 0) cuerpo.campos = e.campos;
    return Response.json(cuerpo, { status: e.httpStatus });
  }
  console.error("Error no controlado:", e);
  const cuerpo: CuerpoError = {
    codigo: "ERROR_INTERNO",
    mensaje: "Ocurrio un error inesperado.",
  };
  return Response.json(cuerpo, { status: 500 });
}

export function ok(data: unknown, status = 200): Response {
  return Response.json(data, { status });
}
