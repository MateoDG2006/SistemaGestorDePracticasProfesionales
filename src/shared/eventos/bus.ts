import type { Tx } from "@/src/shared/db/prisma";

// Bus de eventos en el mismo proceso (Fase 2, seccion 2.5). Los manejadores
// se ejecutan dentro de la MISMA transaccion que origina el evento, de modo
// que si la transaccion se revierte tampoco quedan efectos (ej. outbox).

export interface EventoDominio {
  tipo: string;
}

export type Manejador<E extends EventoDominio = EventoDominio> = (
  evento: E,
  tx: Tx,
) => Promise<void>;

const suscriptores = new Map<string, Manejador[]>();

export const bus = {
  suscribir(tipo: string, manejador: Manejador): void {
    const lista = suscriptores.get(tipo) ?? [];
    lista.push(manejador);
    suscriptores.set(tipo, lista);
  },

  async publicar(tx: Tx, evento: EventoDominio): Promise<void> {
    const lista = suscriptores.get(evento.tipo) ?? [];
    for (const manejador of lista) {
      await manejador(evento, tx);
    }
  },
};
