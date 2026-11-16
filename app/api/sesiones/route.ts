import { z } from "zod";
import { ejecutar, leerJson } from "@/src/shared/http/responder";
import { ok } from "@/src/shared/errores/respuesta";
import { arrancar } from "@/src/arranque";
import { iniciarSesion } from "@/src/modules/identidad/aplicacion/iniciarSesion";
import { usuarioActual, cerrarSesion } from "@/src/shared/auth/sesion";

const Login = z.object({ correo: z.string().email(), contrasena: z.string().min(1) });

export async function POST(req: Request) {
  arrancar();
  return ejecutar(async () => {
    const { correo, contrasena } = await leerJson(req, Login);
    const u = await iniciarSesion(correo, contrasena);
    return ok(u, 201);
  });
}

export async function GET() {
  return ejecutar(async () => {
    const u = await usuarioActual();
    return ok({ usuario: u });
  });
}

export async function DELETE() {
  return ejecutar(async () => {
    await cerrarSesion();
    return new Response(null, { status: 204 });
  });
}
