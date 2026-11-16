"use client";

import { useEffect, useState } from "react";
import { misSolicitudes } from "../../_lib/api";
import { useSesion } from "../../_lib/session-context";
import type { Solicitud } from "../../_lib/types";
import { fecha } from "../../_lib/format";
import {
  Button,
  Card,
  ChipSolicitud,
  HighlightCard,
  PageHeader,
  SectionTitle,
  Spinner,
  StatCard,
  Tabla,
  Fila,
  Celda,
  EmptyState,
  Mensaje,
} from "../../_components/ui";
import { AreaChart } from "../../_components/charts";
import { IconCalendar, IconPlus } from "../../_components/icons";

const EN_TRAMITE = ["BORRADOR", "ENVIADA", "DEVUELTA", "APROBADA"];
const PASOS = ["Borrador", "Enviada", "Aprobada", "Formalizada"];

function pasoActual(e?: string) {
  switch (e) {
    case "BORRADOR":
      return 0;
    case "ENVIADA":
    case "DEVUELTA":
      return 1;
    case "APROBADA":
      return 2;
    default:
      return 0;
  }
}

export default function EstudianteInicio() {
  const { usuario } = useSesion();
  const [lista, setLista] = useState<Solicitud[] | null>(null);

  useEffect(() => {
    misSolicitudes().then(setLista).catch(() => setLista([]));
  }, []);

  const actual = lista?.find((s) => EN_TRAMITE.includes(s.estado));
  const nombre = usuario?.nombre.split(" ")[0] ?? "";

  return (
    <>
      <PageHeader saludo="Bienvenida," nombre={nombre}>
        <span className="hidden items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink-soft md:inline-flex">
          <IconCalendar width={16} height={16} /> 2.º Semestre 2026
        </span>
        <Button href="/estudiante/solicitud">
          <IconPlus width={18} height={18} /> Nueva solicitud
        </Button>
      </PageHeader>

      {lista === null ? (
        <div className="grid place-items-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Estado del trámite (tarjeta destacada) */}
            <HighlightCard
              titulo="Estado de mi trámite"
              pie={
                actual ? (
                  <span>Periodo propuesto: {fecha(actual.fechaInicio)} – {fecha(actual.fechaFin)}</span>
                ) : (
                  "Aún no ha iniciado una solicitud."
                )
              }
            >
              {actual ? (
                <div>
                  <p className="text-sm text-white/60">{actual.numero ?? "Borrador"}</p>
                  <p className="mt-1 text-2xl font-semibold">{actual.empresaNombre || "—"}</p>
                  <div className="mt-3 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                    {actual.estado}
                  </div>
                </div>
              ) : (
                <p className="text-lg font-medium">Sin solicitud activa</p>
              )}
            </HighlightCard>

            {/* Progreso */}
            <Card className="p-5 lg:col-span-2">
              <SectionTitle titulo="Progreso del trámite" subtitulo="De la solicitud a la formalización" />
              <div className="mt-5 flex items-center">
                {PASOS.map((p, i) => {
                  const done = i <= pasoActual(actual?.estado);
                  return (
                    <div key={p} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`grid h-9 w-9 place-items-center rounded-full text-sm font-semibold ${
                            done ? "bg-ink text-on-ink" : "border border-border bg-surface text-ink-soft"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="text-xs text-ink-soft">{p}</span>
                      </div>
                      {i < PASOS.length - 1 && (
                        <div className={`mx-2 mb-5 h-0.5 flex-1 ${done ? "bg-ink" : "bg-border"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <AreaChart valores={[2, 3, 2.5, 4, 3.5, 5, 4.5, 6]} alto={110} />
              </div>
            </Card>
          </div>

          {actual?.estado === "DEVUELTA" && actual.ultimaObservacion && (
            <Mensaje tipo="error">
              <b>Solicitud devuelta por el Vicedecanato.</b> {actual.ultimaObservacion}{" "}
              <a href="/estudiante/solicitud" className="font-medium underline">
                Corregir y reenviar
              </a>
            </Mensaje>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard etiqueta="Solicitudes" valor={lista.length} pie="en total" />
            <StatCard
              etiqueta="Documentos cargados"
              valor={lista.filter((s) => s.notaAceptacion).length}
              pie="notas de aceptación"
            />
            <StatCard
              etiqueta="Duración mínima"
              valor="6 meses"
              pie="requisito RN-03"
            />
          </div>

          <Card className="p-5">
            <SectionTitle
              titulo="Mis solicitudes"
              subtitulo="Historial reciente"
              accion={<Button variante="secundario" tamano="sm" href="/estudiante/solicitudes">Ver todas</Button>}
            />
            <div className="mt-4">
              {lista.length ? (
                <Tabla columnas={["N.º", "Empresa", "Periodo", "Estado"]}>
                  {lista.map((s) => (
                    <Fila key={s.id}>
                      <Celda className="font-medium">{s.numero ?? "(borrador)"}</Celda>
                      <Celda>{s.empresaNombre || "—"}</Celda>
                      <Celda className="text-ink-soft">{fecha(s.fechaInicio)} – {fecha(s.fechaFin)}</Celda>
                      <Celda><ChipSolicitud estado={s.estado} /></Celda>
                    </Fila>
                  ))}
                </Tabla>
              ) : (
                <EmptyState>Todavía no tiene solicitudes. Cree una nueva para comenzar.</EmptyState>
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}
