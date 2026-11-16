import { ejecutar } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { arrancar } from "@/src/arranque";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { enviarSolicitud } from "@/src/modules/solicitudes/aplicacion/enviarSolicitud";

// POST /api/solicitudes/{id}/envio (CU-01): valida y envia la solicitud.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  arrancar();
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.ESTUDIANTE);
    const { id } = await ctx.params;
    return ok(await enviarSolicitud(id, u.id));
  });
}
