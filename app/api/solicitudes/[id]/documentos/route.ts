import { ejecutar, verificarTamano } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { arrancar } from "@/src/arranque";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { ErrorPeticion } from "@/src/shared/errores/errores";
import { cargarDocumento } from "@/src/modules/solicitudes/aplicacion/cargarDocumento";

// POST /api/solicitudes/{id}/documentos (CU-01 / CU-02): carga un PDF (multipart).
// Campos: archivo (File), tipo (NOTA_ACEPTACION | RECOMENDACION_COMISION | OTRO).
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  arrancar();
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.ESTUDIANTE, Rol.VICEDECANATO);
    verificarTamano(req);
    const { id } = await ctx.params;

    const form = await req.formData();
    const archivo = form.get("archivo");
    const tipo = String(form.get("tipo") ?? "");
    if (!(archivo instanceof File)) throw new ErrorPeticion("Falta el archivo.");

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const doc = await cargarDocumento(u, id, {
      tipo,
      nombreOriginal: archivo.name,
      buffer,
      mime: archivo.type,
    });
    return ok(doc, 201);
  });
}
