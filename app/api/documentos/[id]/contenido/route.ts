import { ejecutar } from "@/src/shared/http/responder";
import { arrancar } from "@/src/arranque";
import { requerirUsuario } from "@/src/shared/auth/sesion";
import { Rol } from "@/src/shared/dominio/enums";
import { prisma } from "@/src/shared/db/prisma";
import { leerArchivo } from "@/src/shared/pdf/almacenArchivos";
import { ErrorNoEncontrado, ErrorNoAutorizado } from "@/src/shared/errores/errores";

// GET /api/documentos/{id}/contenido (CU-02, CU-03): descarga el PDF solo a
// participantes autorizados (RNF-01). La ruta nunca se expone como URL publica.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  arrancar();
  return ejecutar(async () => {
    const u = await requerirUsuario(Rol.ESTUDIANTE, Rol.VICEDECANATO, Rol.ASESOR, Rol.SUPERVISOR);
    const { id } = await ctx.params;

    let ruta: string | null = null;
    let nombre = "documento.pdf";

    const docSol = await prisma.documentoSolicitud.findUnique({
      where: { id },
      include: { solicitud: { select: { estudianteId: true } } },
    });
    if (docSol) {
      const permitido = u.rol === Rol.VICEDECANATO || docSol.solicitud.estudianteId === u.id;
      if (!permitido) throw new ErrorNoAutorizado();
      ruta = docSol.ruta;
      nombre = docSol.nombreOriginal;
    } else {
      const docPrac = await prisma.documentoPractica.findUnique({
        where: { id },
        include: { practica: { select: { estudianteId: true, asesorId: true, supervisorId: true } } },
      });
      if (!docPrac) throw new ErrorNoEncontrado("Documento no encontrado.");
      const p = docPrac.practica;
      const permitido =
        u.rol === Rol.VICEDECANATO ||
        p.estudianteId === u.id ||
        p.asesorId === u.id ||
        p.supervisorId === u.id;
      if (!permitido) throw new ErrorNoAutorizado();
      ruta = docPrac.ruta;
      nombre = docPrac.nombreOriginal;
    }

    const contenido = await leerArchivo(ruta);
    return new Response(new Uint8Array(contenido), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(nombre)}"`,
      },
    });
  });
}
