import { ejecutar } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { consultarMias } from "@/src/modules/solicitudes/aplicacion/consultas";

export async function GET() {
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.ESTUDIANTE);
    return ok(await consultarMias(u.id));
  });
}
