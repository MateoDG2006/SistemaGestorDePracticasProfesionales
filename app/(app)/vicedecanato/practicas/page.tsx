"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listarPracticas, reenviarInvitacion } from "../../../_lib/api";
import type { Practica } from "../../../_lib/types";
import { fecha, horasRestantes } from "../../../_lib/format";
import { CANTIDAD_PERIODOS, textoVencimientoInvitacion } from "@/src/shared/dominio/reglas";
import {
  Button,
  Card,
  Celda,
  ChipInvitacion,
  ChipPractica,
  EmptyState,
  Fila,
  Mensaje,
  PageHeader,
  Spinner,
  Tabla,
} from "../../../_components/ui";
import { LuRefreshCw } from "react-icons/lu";

export default function Pagina() {
  return (
    <Suspense fallback={<div className="grid place-items-center py-24"><Spinner /></div>}>
      <Contenido />
    </Suspense>
  );
}

function Contenido() {
  const params = useSearchParams();
  const formalizada = params.get("formalizada");
  const [lista, setLista] = useState<Practica[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(
    formalizada ? `Práctica formalizada: se generaron los ${CANTIDAD_PERIODOS} períodos y se envió la invitación al supervisor.` : null,
  );
  const [reenviando, setReenviando] = useState<string>("");

  const cargar = useCallback(() => {
    listarPracticas().then(setLista).catch(() => setLista([]));
  }, []);
  useEffect(cargar, [cargar]);

  async function reenviar(id: string) {
    setReenviando(id);
    try {
      await reenviarInvitacion(id);
      setAviso(`Invitación reenviada (vence en ${textoVencimientoInvitacion()}).`);
      cargar();
    } finally {
      setReenviando("");
    }
  }

  return (
    <>
      <PageHeader saludo="Prácticas formalizadas" />
      {aviso && <Mensaje tipo="ok">{aviso}</Mensaje>}

      {lista === null ? (
        <div className="grid place-items-center py-24"><Spinner /></div>
      ) : lista.length ? (
        <div className="flex flex-col gap-4">
          {lista.map((p) => (
            <Card key={p.id} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-ink">{p.numeroSolicitud}</h2>
                    <ChipPractica estado={p.estado} />
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    Estudiante: <span className="text-ink">{p.estudianteNombre}</span> · Asesor:{" "}
                    <span className="text-ink">{p.asesorNombre}</span>
                  </p>
                  <p className="text-sm text-ink-soft">
                    Supervisor: <span className="text-ink">{p.supervisorCorreo}</span>{" "}
                    {p.supervisorVinculado ? (
                      <span className="font-medium text-ink">· acceso activo</span>
                    ) : (
                      p.invitacion && <>· invitación <ChipInvitacion estado={p.invitacion.estado} /></>
                    )}
                  </p>
                  <p className="text-sm text-ink-soft">
                    Periodo: {fecha(p.fechaInicio)} – {fecha(p.fechaFin)} · Convenio:{" "}
                    <span className="text-ink">{p.convenio?.nombreOriginal ?? "—"}</span>
                  </p>
                </div>
                {!p.supervisorVinculado && p.invitacion && p.invitacion.estado !== "USADA" && (
                  <Button
                    variante="secundario"
                    tamano="sm"
                    disabled={reenviando === p.id}
                    onClick={() => reenviar(p.id)}
                  >
                    {reenviando === p.id ? <Spinner className="h-4 w-4" /> : <><LuRefreshCw size={16} /> Reenviar invitación</>}
                  </Button>
                )}
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Períodos mensuales
                </p>
                <Tabla columnas={["Período", "Inicio", "Cierre", "Vence informe"]}>
                  {p.periodos.map((x) => (
                    <Fila key={x.numero}>
                      <Celda className="font-medium">{x.numero}</Celda>
                      <Celda>{fecha(x.fechaInicio)}</Celda>
                      <Celda>{fecha(x.fechaCierre)}</Celda>
                      <Celda className="text-ink-soft">{fecha(x.venceInforme)}</Celda>
                    </Fila>
                  ))}
                </Tabla>
                {p.invitacion && p.invitacion.estado === "PENDIENTE" && (
                  <p className="mt-2 text-xs text-ink-soft">
                    Invitación vigente · vence en {horasRestantes(p.invitacion.venceEn)} h.
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-5"><EmptyState>Aún no hay prácticas formalizadas.</EmptyState></Card>
      )}
    </>
  );
}
