import { ejecutar } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { listarDocentes } from "@/src/modules/identidad/infra/identidadApi";

export async function GET() {
  return ejecutar(async () => {
    await requerirUsuario(Rol.ESTUDIANTE, Rol.VICEDECANATO);
    return ok(await listarDocentes());
  });
}
