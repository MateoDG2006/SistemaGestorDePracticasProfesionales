import { z } from "zod";
import { ejecutar, leerJson } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { arrancar } from "@/src/arranque";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { actualizarBorrador } from "@/src/modules/solicitudes/aplicacion/guardarSolicitud";
import { obtenerDetalle } from "@/src/modules/solicitudes/aplicacion/consultas";
import { SolicitudBody, aSolicitudInput } from "../route";

const Actualizar = z.object({ version: z.number().int().nonnegative() }).and(SolicitudBody);

// GET /api/solicitudes/{id} (CU-02): detalle con documentos y version.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.VICEDECANATO, Rol.ESTUDIANTE);
    const { id } = await ctx.params;
    return ok(await obtenerDetalle(u, id));
  });
}

// PUT /api/solicitudes/{id} (CU-01 A1/A2): actualiza borrador o solicitud devuelta.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  arrancar();
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.ESTUDIANTE);
    const { id } = await ctx.params;
    const body = await leerJson(req, Actualizar);
    const sol = await actualizarBorrador(id, u.id, body.version, aSolicitudInput(body));
    return ok({ id: sol?.id, estado: sol?.estado, version: sol?.version });
  });
}
