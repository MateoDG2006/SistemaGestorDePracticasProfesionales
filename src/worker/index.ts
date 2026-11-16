import { arrancar } from "@/src/arranque";
import { despacharOutbox } from "./despachadorOutbox";
import { activarPracticas } from "./activarPracticas";
import { vencerInvitaciones } from "./vencerInvitaciones";

// Worker: comparte el codigo del proceso web (Fase 2, 2.1 / 4.7).
//  - DespachadorOutbox: cada 30 s
//  - VencerInvitacionesJob: cada hora
//  - ActivarPracticasJob: diario (aqui aproximado por intervalo; en produccion, cron 00:05)

arrancar(); // registra los suscriptores de Notificaciones

async function seguro(nombre: string, fn: () => Promise<number>) {
  try {
    const n = await fn();
    if (n > 0) console.log(`[worker] ${nombre}: ${n}`);
  } catch (e) {
    console.error(`[worker] ${nombre} fallo:`, e);
  }
}

console.log("[worker] iniciado");
setInterval(() => void seguro("outbox", despacharOutbox), 30_000);
setInterval(() => void seguro("vencerInvitaciones", vencerInvitaciones), 3_600_000);
setInterval(() => void seguro("activarPracticas", activarPracticas), 3_600_000);

// Ejecucion inmediata al arrancar.
void seguro("outbox", despacharOutbox);
void seguro("vencerInvitaciones", vencerInvitaciones);
void seguro("activarPracticas", activarPracticas);
