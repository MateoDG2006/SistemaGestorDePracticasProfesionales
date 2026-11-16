"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { misSolicitudes } from "../../../_lib/api";
import type { Solicitud } from "../../../_lib/types";
import { fecha } from "../../../_lib/format";
import { solicitudEditable } from "@/src/shared/dominio/reglas";
import {
  Button,
  Card,
  Celda,
  ChipSolicitud,
  EmptyState,
  Fila,
  Mensaje,
  PageHeader,
  Spinner,
  Tabla,
} from "../../../_components/ui";

export default function Pagina() {
  return (
    <Suspense fallback={<div className="grid place-items-center py-24"><Spinner /></div>}>
      <Contenido />
    </Suspense>
  );
}

function Contenido() {
  const params = useSearchParams();
  const enviada = params.get("enviada");
  const [lista, setLista] = useState<Solicitud[] | null>(null);

  useEffect(() => {
    misSolicitudes().then(setLista).catch(() => setLista([]));
  }, []);

  return (
    <>
      <PageHeader saludo="Mis solicitudes">
        <Button href="/estudiante/solicitud">Nueva solicitud</Button>
      </PageHeader>

      {enviada && <Mensaje tipo="ok">Solicitud enviada correctamente. Número: <b>{enviada}</b></Mensaje>}

      <Card className="p-5">
        {lista === null ? (
          <div className="grid place-items-center py-16"><Spinner /></div>
        ) : lista.length ? (
          <Tabla columnas={["N.º", "Empresa", "Periodo", "Estado", "Observaciones", ""]}>
            {lista.map((s) => (
              <Fila key={s.id}>
                <Celda className="font-medium">{s.numero ?? "(borrador)"}</Celda>
                <Celda>{s.empresaNombre || "—"}</Celda>
                <Celda className="text-ink-soft">{fecha(s.fechaInicio)} – {fecha(s.fechaFin)}</Celda>
                <Celda><ChipSolicitud estado={s.estado} /></Celda>
                <Celda className="max-w-xs text-ink-soft">{s.ultimaObservacion || "—"}</Celda>
                <Celda>
                  {solicitudEditable(s.estado) && (
                    <Button variante="secundario" tamano="sm" href="/estudiante/solicitud">Editar</Button>
                  )}
                </Celda>
              </Fila>
            ))}
          </Tabla>
        ) : (
          <EmptyState>No hay solicitudes registradas.</EmptyState>
        )}
      </Card>
    </>
  );
}
