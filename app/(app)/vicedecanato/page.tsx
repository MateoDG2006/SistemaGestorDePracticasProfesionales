"use client";

import { useEffect, useState } from "react";
import { bandejaSolicitudes, listarPracticas } from "../../_lib/api";
import type { Practica, Solicitud } from "../../_lib/types";
import { fecha } from "../../_lib/format";
import {
  Button,
  Card,
  Celda,
  EmptyState,
  Fila,
  HighlightCard,
  PageHeader,
  SectionTitle,
  Spinner,
  StatCard,
  Tabla,
} from "../../_components/ui";
import { Calendar } from "lucide-react";
import { MESES_DURACION_MINIMA } from "@/src/shared/dominio/reglas";

export default function VicedecanatoInicio() {
  const [bandeja, setBandeja] = useState<Solicitud[] | null>(null);
  const [practicas, setPracticas] = useState<Practica[]>([]);

  useEffect(() => {
    bandejaSolicitudes().then(setBandeja).catch(() => setBandeja([]));
    listarPracticas().then(setPracticas).catch(() => {});
  }, []);

  return (
    <>
      <PageHeader saludo="Bienvenido," nombre="Vicedecanato">
        <span className="hidden items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink-soft md:inline-flex">
          <Calendar size={16} /> 2.º Semestre 2026
        </span>
      </PageHeader>

      <HighlightCard titulo="Solicitudes por evaluar" pie="Ordenadas de la más antigua a la más reciente">
        <p className="text-4xl font-semibold">{bandeja?.length ?? "—"}</p>
        <p className="mt-1 text-sm text-white/60">en la bandeja</p>
      </HighlightCard>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard etiqueta="Pendientes" valor={bandeja?.length ?? "—"} pie="por evaluar" />
        <StatCard etiqueta="Prácticas formalizadas" valor={practicas.length} pie="en seguimiento" />
        <StatCard etiqueta="Duración mínima" valor={`${MESES_DURACION_MINIMA} meses`} pie="RN-03" />
      </div>

      <Card className="p-5">
        <SectionTitle titulo="Bandeja de solicitudes" subtitulo="Más antigua primero" />
        <div className="mt-4">
          {bandeja === null ? (
            <div className="grid place-items-center py-12"><Spinner /></div>
          ) : bandeja.length ? (
            <Tabla columnas={["N.º", "Estudiante", "Empresa", "Enviada", ""]}>
              {bandeja.map((s) => (
                <Fila key={s.id}>
                  <Celda className="font-medium">{s.numero}</Celda>
                  <Celda>{s.estudianteNombre}</Celda>
                  <Celda>{s.empresaNombre}</Celda>
                  <Celda className="text-ink-soft">{fecha(s.enviadaEn)}</Celda>
                  <Celda>
                    <Button tamano="sm" href={`/vicedecanato/evaluar/${s.id}`}>Evaluar</Button>
                  </Celda>
                </Fila>
              ))}
            </Tabla>
          ) : (
            <EmptyState>Sin solicitudes pendientes.</EmptyState>
          )}
        </div>
      </Card>
    </>
  );
}
