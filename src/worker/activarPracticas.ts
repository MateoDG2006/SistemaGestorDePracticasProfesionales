import { prisma } from "@/src/shared/db/prisma";
import { EstadoPractica } from "@/src/shared/dominio/enums";
import { soloFecha } from "@/src/shared/fechas";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import { bus } from "@/src/shared/eventos/bus";
import { TipoEvento, type PracticaIniciada } from "@/src/shared/eventos/tipos";

// ActivarPracticasJob (4.7, diario 00:05): pasa a EN_CURSO las practicas
// "Por iniciar" cuya fecha de inicio llego (CU-03 A2). Autor SISTEMA (usuarioId null).
export async function activarPracticas(): Promise<number> {
  const hoy = soloFecha(new Date());
  const porIniciar = await prisma.practica.findMany({
    where: { estado: EstadoPractica.POR_INICIAR, fechaInicio: { lte: hoy } },
  });

  let activadas = 0;
  for (const p of porIniciar) {
    await prisma.$transaction(async (tx) => {
      const r = await tx.practica.updateMany({
        where: { id: p.id, estado: EstadoPractica.POR_INICIAR },
        data: { estado: EstadoPractica.EN_CURSO },
      });
      if (r.count === 0) return;
      await registrarAuditoria(tx, {
        usuarioId: null,
        accion: "PRACTICA_INICIADA",
        entidad: "practica",
        entidadId: p.id,
      });
      const ev: PracticaIniciada = {
        tipo: TipoEvento.PracticaIniciada,
        practicaId: p.id,
        estudianteId: p.estudianteId,
        asesorId: p.asesorId,
      };
      await bus.publicar(tx, ev);
      activadas++;
    });
  }
  return activadas;
}
