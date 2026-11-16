import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/src/shared/auth/token";

// Chequeo optimista de cookie (sin Prisma). La autorizacion real sigue en
// requerirUsuario de cada route handler. En modo mock la sesion vive en el
// cliente (localStorage), sin cookie HTTP.
export function proxy(request: NextRequest) {
  if ((process.env.NEXT_PUBLIC_API_MODE ?? "mock") === "mock") {
    return NextResponse.next();
  }
  const token = request.cookies.get(COOKIE_SESION)?.value;
  if (!token || !verificarSesion(token)) {
    return NextResponse.redirect(new URL("/ingresar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/estudiante",
    "/estudiante/:path*",
    "/vicedecanato",
    "/vicedecanato/:path*",
    "/supervisor",
    "/supervisor/:path*",
    "/auditoria",
    "/auditoria/:path*",
  ],
};
