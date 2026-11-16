import { z } from "zod";
import { respuestaDeError } from "@/src/shared/errores/respuesta";
import { ErrorPeticion, ErrorArchivoGrande } from "@/src/shared/errores/errores";
import { MAX_PDF_BYTES } from "@/src/shared/dominio/reglas";

export async function ejecutar(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    return respuestaDeError(e);
  }
}

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

export function leerFecha(valor: string): Temporal.PlainDate {
  try {
    return Temporal.PlainDate.from(valor);
  } catch {
    throw new ErrorPeticion("Formato de fecha invalido (use YYYY-MM-DD).");
  }
}

// Content-Length incluye el framing multipart, por eso el corte queda 1 MB sobre el limite del PDF.
export function verificarTamano(req: Request): void {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > MAX_PDF_BYTES + 1_000_000) {
    throw new ErrorArchivoGrande();
  }
}
