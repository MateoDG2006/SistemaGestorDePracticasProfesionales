import { ejecutar } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { consultarSugeridasParaAsesor } from "@/src/modules/solicitudes/aplicacion/consultas";

// GET /api/solicitudes/sugeridas-mias: solicitudes que sugieren al asesor autenticado.
export async function GET() {
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.ASESOR);
    return ok(await consultarSugeridasParaAsesor(u.id));
  });
}
