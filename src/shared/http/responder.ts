import { z } from "zod";
import { respuestaDeError } from "@/src/shared/errores/respuesta";
import { ErrorPeticion, ErrorArchivoGrande } from "@/src/shared/errores/errores";
import { MAX_BYTES } from "@/src/shared/pdf/validadorPdf";

// Envuelve un handler y traduce cualquier excepcion al formato comun de error.
export async function ejecutar(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    return respuestaDeError(e);
  }
}

// Lee y valida el cuerpo JSON con un esquema zod (400 con campos si falla).
export async function leerJson<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let data: unknown;
  try {
    data = await req.json();
  } catch {
    throw new ErrorPeticion("El cuerpo no es un JSON valido.");
  }
  const r = schema.safeParse(data);
  if (!r.success) {
    throw new ErrorPeticion(
      "La peticion tiene datos invalidos.",
      r.error.issues.map((i) => ({ campo: i.path.join("."), error: i.message })),
    );
  }
  return r.data;
}

// Fecha "YYYY-MM-DD" -> Date a medianoche UTC.
export function fechaISO(valor: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ErrorPeticion("Formato de fecha invalido (use YYYY-MM-DD).");
  }
  return new Date(`${valor}T00:00:00.000Z`);
}

// Guard temprano por Content-Length (RNF-09, 413) antes de leer el archivo.
export function verificarTamano(req: Request): void {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_BYTES + 1_000_000) {
    throw new ErrorArchivoGrande();
  }
}
