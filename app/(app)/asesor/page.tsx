"use client";

import { useEffect, useState } from "react";
import {
  listarPracticas,
  listarSugeridasAsesor,
  type SugeridaAsesor,
} from "../../_lib/api";
import { useSesion } from "../../_lib/session-context";
import type { Practica } from "../../_lib/types";
import { fecha, primerNombre } from "../../_lib/format";
import {
  Card,
  Celda,
  ChipPractica,
  ChipSolicitud,
  EmptyState,
  EsqueletoPagina,
  Fila,
  HighlightCard,
  PageHeader,
  SectionTitle,
  StatCard,
  Tabla,
} from "../../_components/ui";
import { Calendar } from "lucide-react";
import type { EstadoSolicitud } from "../../_lib/types";

export default function AsesorInicio() {
  const { usuario } = useSesion();
  const [practicas, setPracticas] = useState<Practica[] | null>(null);
  const [sugeridas, setSugeridas] = useState<SugeridaAsesor[] | null>(null);
  const nombre = primerNombre(usuario?.nombre);

  useEffect(() => {
    listarPracticas().then(setPracticas).catch(() => setPracticas([]));
    listarSugeridasAsesor().then(setSugeridas).catch(() => setSugeridas([]));
  }, []);

  if (practicas === null || sugeridas === null) {
    return <EsqueletoPagina />;
  }

  const pendientesFormalizar = sugeridas.filter((s) => !s.formalizada).length;
  const enCurso = practicas.filter((p) => p.estado === "EN_CURSO").length;

  return (
    <>
      <PageHeader saludo="Hola," nombre={nombre}>
        <span className="hidden items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm text-ink-soft md:inline-flex">
          <Calendar size={16} /> Mis estudiantes
        </span>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <HighlightCard
          titulo="Prácticas a mi cargo"
          pie="Formalizadas y asignadas a usted como asesor"
        >
          <p className="text-4xl font-semibold">{practicas.length}</p>
          <p className="mt-1 text-sm text-white/60">en total</p>
        </HighlightCard>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-2">
          <StatCard etiqueta="En curso" valor={enCurso} pie="prácticas activas" />
          <StatCard
            etiqueta="Me sugirieron"
            valor={pendientesFormalizar}
            pie="solicitudes aún sin formalizar"
          />
        </div>
      </div>

      <Card className="p-5">
        <SectionTitle
          titulo="Estudiantes en práctica"
          subtitulo="Prácticas donde usted es el profesor asesor"
        />
        <div className="mt-4">
          {practicas.length ? (
            <Tabla columnas={["Solicitud", "Estudiante", "Periodo", "Supervisor", "Estado"]}>
              {practicas.map((p) => (
                <Fila key={p.id}>
                  <Celda className="font-medium">{p.numeroSolicitud || "—"}</Celda>
                  <Celda>{p.estudianteNombre}</Celda>
                  <Celda className="text-ink-soft">
                    {fecha(p.fechaInicio)} – {fecha(p.fechaFin)}
                  </Celda>
                  <Celda className="text-ink-soft">
                    {p.supervisorCorreo}
                    {p.supervisorVinculado ? " · vinculado" : ""}
                  </Celda>
                  <Celda>
                    <ChipPractica estado={p.estado} />
                  </Celda>
                </Fila>
              ))}
            </Tabla>
          ) : (
            <EmptyState>
              Aún no tiene prácticas formalizadas a su cargo. Aparecerán aquí cuando el
              Vicedecanato lo asigne como asesor.
            </EmptyState>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <SectionTitle
          titulo="Solicitudes que me sugieren"
          subtitulo="El estudiante lo propuso como asesor (antes o después de formalizar)"
        />
        <div className="mt-4">
          {sugeridas.length ? (
            <Tabla columnas={["N.º", "Estudiante", "Empresa", "Periodo", "Estado"]}>
              {sugeridas.map((s) => (
                <Fila key={s.id}>
                  <Celda className="font-medium">{s.numero ?? "(borrador)"}</Celda>
                  <Celda>
                    <span className="block">{s.estudianteNombre}</span>
                    <span className="text-xs text-ink-soft">{s.estudianteCorreo}</span>
                  </Celda>
                  <Celda>{s.empresaNombre || "—"}</Celda>
                  <Celda className="text-ink-soft">
                    {fecha(s.fechaInicio)} – {fecha(s.fechaFin)}
                  </Celda>
                  <Celda>
                    <ChipSolicitud estado={s.estado as EstadoSolicitud} />
                    {s.formalizada && (
                      <span className="ml-2 text-xs text-ink-soft">formalizada</span>
                    )}
                  </Celda>
                </Fila>
              ))}
            </Tabla>
          ) : (
            <EmptyState>
              Ningún estudiante lo ha sugerido como asesor todavía.
            </EmptyState>
          )}
        </div>
      </Card>
    </>
  );
}
