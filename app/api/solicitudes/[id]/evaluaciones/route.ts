import { z } from "zod";
import { ejecutar, leerJson, leerFecha } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { arrancar } from "@/src/arranque";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { evaluarSolicitud } from "@/src/modules/solicitudes/aplicacion/evaluarSolicitud";

const Body = z.object({
  version: z.number().int().nonnegative(),
  decision: z.enum(["APROBAR", "DEVOLVER", "RECHAZAR"]),
  asignaturasAprobadas: z.boolean().optional(),
  indiceMinimo: z.boolean().optional(),
  documentacionCompleta: z.boolean().optional(),
  jefeDepartamento: z.string().nullish(),
  fechaAprobacionJefe: z.string().nullish(),
  documentoComisionId: z.string().uuid().nullish(),
  observaciones: z.string().nullish(),
});

// POST /api/solicitudes/{id}/evaluaciones (CU-02): aprueba, devuelve o rechaza.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  arrancar();
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.VICEDECANATO);
    const { id } = await ctx.params;
    const b = await leerJson(req, Body);
    const r = await evaluarSolicitud(u.id, id, b.version, {
      decision: b.decision,
      asignaturasAprobadas: b.asignaturasAprobadas ?? false,
      indiceMinimo: b.indiceMinimo ?? false,
      documentacionCompleta: b.documentacionCompleta ?? false,
      jefeDepartamento: b.jefeDepartamento ?? null,
      fechaAprobacionJefe: b.fechaAprobacionJefe ? leerFecha(b.fechaAprobacionJefe) : null,
      documentoComisionId: b.documentoComisionId ?? null,
      observaciones: b.observaciones ?? null,
    });
    return ok(r);
  });
}
