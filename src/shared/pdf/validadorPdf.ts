import { ErrorArchivoGrande, ErrorTipoArchivo } from "@/src/shared/errores/errores";
import { excedePdf, mimePdfInvalido } from "@/src/shared/dominio/reglas";

export function validarPdf(buffer: Buffer, mimeDeclarado?: string): void {
  if (excedePdf(buffer.byteLength)) {
    throw new ErrorArchivoGrande();
  }
  const firma = buffer.subarray(0, 5).toString("latin1");
  if (firma !== "%PDF-") {
    throw new ErrorTipoArchivo("El archivo no es un PDF valido.");
  }
  if (mimePdfInvalido(mimeDeclarado)) {
    throw new ErrorTipoArchivo();
  }
}
