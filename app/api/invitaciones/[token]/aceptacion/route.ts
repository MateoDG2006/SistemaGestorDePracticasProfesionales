import { z } from "zod";
import { ejecutar, leerJson } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { arrancar } from "@/src/arranque";
import { aceptarInvitacion } from "@/src/modules/identidad/aplicacion/aceptarInvitacion";

const Body = z.object({ nombre: z.string().min(1), contrasena: z.string().min(8) });

// POST /api/invitaciones/{token}/aceptacion (CU-03): el supervisor crea/vincula
// su cuenta con la invitacion de un solo uso. Punto de entrada anonimo (token).
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  arrancar();
  return ejecutar(async () => {
    const { token } = await ctx.params;
    const { nombre, contrasena } = await leerJson(req, Body);
    return ok(await aceptarInvitacion(token, nombre, contrasena));
  });
}
