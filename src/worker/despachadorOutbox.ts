import { prisma } from "@/src/shared/db/prisma";
import { EstadoOutbox } from "@/src/shared/dominio/enums";
import { enviarCorreo } from "./mailer";

const MAX_INTENTOS = 3; // RNF-05

// DespachadorOutbox (Fase 2, 4.7): toma mensajes pendientes, los envia y aplica
// hasta 3 reintentos con espera creciente. Con un ciclo de 30 s el primer intento
// ocurre muy por debajo del limite de 5 minutos.
export async function despacharOutbox(): Promise<number> {
  const pendientes = await prisma.mensajeOutbox.findMany({
    where: { estado: EstadoOutbox.PENDIENTE, proximoIntentoEn: { lte: new Date() } },
    orderBy: { proximoIntentoEn: "asc" },
    take: 20,
  });

  let enviados = 0;
  for (const m of pendientes) {
    const payload = (m.payload ?? {}) as { mensaje?: string };
    const asunto = `SGPP FISC: ${m.tipoEvento}`;
    try {
      await enviarCorreo(m.correoDestino, asunto, payload.mensaje ?? asunto);
      await prisma.mensajeOutbox.update({
        where: { id: m.id },
        data: { estado: EstadoOutbox.ENVIADO, enviadoEn: new Date() },
      });
      enviados++;
    } catch (e) {
      const intentos = m.intentos + 1;
      const agotado = intentos >= MAX_INTENTOS;
      const esperaMin = Math.pow(2, intentos); // espera creciente
      await prisma.mensajeOutbox.update({
        where: { id: m.id },
        data: {
          intentos,
          estado: agotado ? EstadoOutbox.FALLIDO : EstadoOutbox.PENDIENTE,
          proximoIntentoEn: new Date(Date.now() + esperaMin * 60_000),
          ultimoError: e instanceof Error ? e.message : String(e),
        },
      });
    }
  }
  return enviados;
}
