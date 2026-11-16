import { ejecutar, verificarTamano, leerFecha } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { arrancar } from "@/src/arranque";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { ErrorPeticion } from "@/src/shared/errores/errores";
import { formalizarPractica } from "@/src/modules/practicas/aplicacion/formalizarPractica";

// POST /api/practicas (CU-03): formaliza una solicitud aprobada (multipart).
// Campos: convenio (File PDF), solicitudId, asesorId?, fechaInicio?, fechaFin?.
export async function POST(req: Request) {
  arrancar();
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.VICEDECANATO);
    verificarTamano(req);

    const form = await req.formData();
    const solicitudId = String(form.get("solicitudId") ?? "");
    if (!solicitudId) throw new ErrorPeticion("Falta solicitudId.");
    const convenio = form.get("convenio");
    if (!(convenio instanceof File)) throw new ErrorPeticion("Falta el convenio (PDF).");

    const supervisorCorreo = form.get("supervisorCorreo") ? String(form.get("supervisorCorreo")) : null;
    const asesorId = form.get("asesorId") ? String(form.get("asesorId")) : null;
    const fi = form.get("fechaInicio") ? leerFecha(String(form.get("fechaInicio"))) : null;
    const ff = form.get("fechaFin") ? leerFecha(String(form.get("fechaFin"))) : null;

    const buffer = Buffer.from(await convenio.arrayBuffer());
    const r = await formalizarPractica(u.id, {
      solicitudId,
      asesorId,
      supervisorCorreo,
      fechaInicio: fi,
      fechaFin: ff,
      convenio: { nombreOriginal: convenio.name, buffer, mime: convenio.type },
    });
    return ok(r, 201);
  });
}
