import { ErrorArchivoGrande, ErrorTipoArchivo } from "@/src/shared/errores/errores";

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (RNF-09)

// Valida el tipo real por la firma "%PDF-" y el tamano (CU-01 paso 9 / E2).
// El limite de tamano de la peticion se controla ademas en la presentacion.
export function validarPdf(buffer: Buffer, mimeDeclarado?: string): void {
  if (buffer.byteLength > MAX_BYTES) {
    throw new ErrorArchivoGrande();
  }
  const firma = buffer.subarray(0, 5).toString("latin1");
  if (firma !== "%PDF-") {
    throw new ErrorTipoArchivo("El archivo no es un PDF valido.");
  }
  if (mimeDeclarado && mimeDeclarado !== "application/pdf") {
    throw new ErrorTipoArchivo();
  }
}
