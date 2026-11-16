"use client";

import { useEffect, useState } from "react";
import { listarAuditoria, listarNotificaciones } from "../../_lib/api";
import type { Auditoria, Notificacion } from "../../_lib/types";
import { fechaHora } from "../../_lib/format";
import {
  Card,
  Celda,
  EmptyState,
  Fila,
  PageHeader,
  SectionTitle,
  Spinner,
  Tabla,
} from "../../_components/ui";

export default function PaginaAuditoria() {
  const [aud, setAud] = useState<Auditoria[] | null>(null);
  const [notis, setNotis] = useState<Notificacion[] | null>(null);

  useEffect(() => {
    listarAuditoria().then(setAud).catch(() => setAud([]));
    listarNotificaciones().then(setNotis).catch(() => setNotis([]));
  }, []);

  return (
    <>
      <PageHeader saludo="Auditoría y notificaciones" />

      <Card className="p-5">
        <SectionTitle titulo="registro_auditoria" subtitulo="Acciones registradas en la misma transacción (RNF-04)" />
        <div className="mt-4">
          {aud === null ? (
            <div className="grid place-items-center py-10"><Spinner /></div>
          ) : aud.length ? (
            <Tabla columnas={["#", "Usuario", "Acción", "Entidad", "Fecha"]}>
              {aud.map((a) => (
                <Fila key={a.id}>
                  <Celda className="text-ink-soft">{a.id}</Celda>
                  <Celda className="font-medium">{a.usuario}</Celda>
                  <Celda><span className="font-mono text-xs">{a.accion}</span></Celda>
                  <Celda className="text-ink-soft">{a.entidad}</Celda>
                  <Celda className="text-ink-soft">{a.ocurridoEn}</Celda>
                </Fila>
              ))}
            </Tabla>
          ) : (
            <EmptyState>Sin registros de auditoría.</EmptyState>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle titulo="notificacion / mensaje_outbox" subtitulo="Avisos del trámite y estado de envío (RF-09, RNF-05)" />
        <div className="mt-4">
          {notis === null ? (
            <div className="grid place-items-center py-10"><Spinner /></div>
          ) : notis.length ? (
            <Tabla columnas={["Evento", "Mensaje", "Fecha", "Outbox"]}>
              {notis.map((n) => (
                <Fila key={n.id}>
                  <Celda><span className="font-mono text-xs">{n.tipoEvento}</span></Celda>
                  <Celda className="max-w-md text-ink-soft">{n.mensaje}</Celda>
                  <Celda className="text-ink-soft">{fechaHora(n.creadaEn)}</Celda>
                  <Celda>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-ink-soft">
                      {n.estadoOutbox ?? "—"}
                    </span>
                  </Celda>
                </Fila>
              ))}
            </Tabla>
          ) : (
            <EmptyState>Sin notificaciones.</EmptyState>
          )}
        </div>
      </Card>
    </>
  );
}
