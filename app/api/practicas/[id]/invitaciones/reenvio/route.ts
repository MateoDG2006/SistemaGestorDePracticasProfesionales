import { ejecutar } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { arrancar } from "@/src/arranque";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { reenviarInvitacion } from "@/src/modules/practicas/aplicacion/reenviarInvitacion";

// POST /api/practicas/{id}/invitaciones/reenvio (CU-03 E4).
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  arrancar();
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.VICEDECANATO);
    const { id } = await ctx.params;
    return ok(await reenviarInvitacion(u.id, id));
  });
}
