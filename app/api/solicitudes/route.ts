import { z } from "zod";
import { ejecutar, leerJson, leerFecha } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { arrancar } from "@/src/arranque";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { crearBorrador, type SolicitudInput } from "@/src/modules/solicitudes/aplicacion/guardarSolicitud";
import { consultarBandeja } from "@/src/modules/solicitudes/aplicacion/consultas";
import { listarAprobadasSinFormalizar } from "@/src/modules/solicitudes/infra/solicitudesApi";

export const EmpresaSchema = z.object({
  nombre: z.string().min(1),
  ruc: z.string().nullish(),
  direccion: z.string().nullish(),
  telefono: z.string().nullish(),
  correo: z.string().email().nullish(),
});

export const SolicitudBody = z.object({
  empresa: EmpresaSchema.nullish(),
  supervisorNombre: z.string().nullish(),
  supervisorCargo: z.string().nullish(),
  supervisorCorreo: z.string().email().nullish(),
  supervisorTelefono: z.string().nullish(),
  objetivo: z.string().nullish(),
  actividades: z.string().nullish(),
  fechaInicio: z.string().nullish(),
  fechaFin: z.string().nullish(),
  asesorSugeridoId: z.string().uuid().nullish(),
  consentimientoDatos: z.boolean().optional(),
});

export function aSolicitudInput(b: z.infer<typeof SolicitudBody>): SolicitudInput {
  return {
    empresa: b.empresa ?? null,
    supervisorNombre: b.supervisorNombre ?? null,
    supervisorCargo: b.supervisorCargo ?? null,
    supervisorCorreo: b.supervisorCorreo ?? null,
    supervisorTelefono: b.supervisorTelefono ?? null,
    objetivo: b.objetivo ?? null,
    actividades: b.actividades ?? null,
    fechaInicio: b.fechaInicio ? leerFecha(b.fechaInicio) : null,
    fechaFin: b.fechaFin ? leerFecha(b.fechaFin) : null,
    asesorSugeridoId: b.asesorSugeridoId ?? null,
    consentimientoDatos: b.consentimientoDatos ?? false,
  };
}

// POST /api/solicitudes (CU-01): crea un borrador.
export async function POST(req: Request) {
  arrancar();
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.ESTUDIANTE);
    const body = await leerJson(req, SolicitudBody);
    const sol = await crearBorrador(u.id, aSolicitudInput(body));
    return ok({ id: sol.id, estado: sol.estado, version: sol.version }, 201);
  });
}

// GET /api/solicitudes?estado=ENVIADA|APROBADA&sinFormalizar=true&pagina=n (CU-02, CU-03).
export async function GET(req: Request) {
  return ejecutar(async () => {
    await requerirUsuario(Rol.VICEDECANATO);
    const sp = new URL(req.url).searchParams;
    const estado = sp.get("estado");
    if (estado === "APROBADA" && sp.get("sinFormalizar") === "true") {
      return ok(await listarAprobadasSinFormalizar());
    }
    const pagina = Number(sp.get("pagina") ?? "1");
    return ok(await consultarBandeja(Number.isFinite(pagina) ? pagina : 1));
  });
}
