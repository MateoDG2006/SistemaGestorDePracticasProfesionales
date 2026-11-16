"use client";

import { useCallback, useEffect, useState } from "react";
import { aceptarInvitacion, ApiError, invitacionesSupervisor } from "../../_lib/api";
import type { Invitacion } from "../../_lib/types";
import { fechaHora, horasRestantes } from "../../_lib/format";
import { textoVencimientoInvitacion } from "@/src/shared/dominio/reglas";
import {
  Button,
  Card,
  Celda,
  ChipInvitacion,
  EmptyState,
  Fila,
  HighlightCard,
  Mensaje,
  PageHeader,
  SectionTitle,
  Spinner,
  Tabla,
} from "../../_components/ui";

export default function Supervisor() {
  const [lista, setLista] = useState<Invitacion[] | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [procesando, setProcesando] = useState("");

  const cargar = useCallback(() => {
    invitacionesSupervisor().then(setLista).catch(() => setLista([]));
  }, []);
  useEffect(cargar, [cargar]);

  async function aceptar(inv: Invitacion) {
    setProcesando(inv.id);
    setAviso(null);
    try {
      await aceptarInvitacion(inv.id);
      setAviso({ tipo: "ok", texto: "Cuenta de supervisor vinculada a la práctica." });
      cargar();
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof ApiError ? e.message : "No se pudo aceptar." });
      cargar();
    } finally {
      setProcesando("");
    }
  }

  const pendientes = lista?.filter((i) => i.estado === "PENDIENTE").length ?? 0;

  return (
    <>
      <PageHeader saludo="Invitaciones" />
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <div className="grid gap-4 lg:grid-cols-3">
        <HighlightCard titulo="Invitaciones pendientes" pie={`Cada invitación vence a las ${textoVencimientoInvitacion()}`}>
          <p className="text-4xl font-semibold">{lista === null ? "—" : pendientes}</p>
          <p className="mt-1 text-sm text-white/60">por aceptar</p>
        </HighlightCard>
        <Card className="p-5 lg:col-span-2">
          <SectionTitle titulo="Supervisión de prácticas" subtitulo="Acepte la invitación para vincular su cuenta a la práctica asignada." />
          <p className="mt-4 text-sm text-ink-soft">
            Al aceptar, su cuenta queda habilitada como supervisor de empresa para el seguimiento de la práctica.
          </p>
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle titulo="Invitaciones recibidas" />
        <div className="mt-4">
          {lista === null ? (
            <div className="grid place-items-center py-12"><Spinner /></div>
          ) : lista.length ? (
            <Tabla columnas={["Correo", "Vence", "Estado", ""]}>
              {lista.map((i) => (
                <Fila key={i.id}>
                  <Celda className="font-medium">{i.correoDestino}</Celda>
                  <Celda className="text-ink-soft">
                    {fechaHora(i.venceEn)}
                    {i.estado === "PENDIENTE" && <span className="ml-1 text-xs">({horasRestantes(i.venceEn)} h)</span>}
                  </Celda>
                  <Celda><ChipInvitacion estado={i.estado} /></Celda>
                  <Celda>
                    {i.estado === "PENDIENTE" && (
                      <Button tamano="sm" disabled={procesando === i.id} onClick={() => aceptar(i)}>
                        {procesando === i.id ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : "Aceptar"}
                      </Button>
                    )}
                  </Celda>
                </Fila>
              ))}
            </Tabla>
          ) : (
            <EmptyState>Sin invitaciones por el momento.</EmptyState>
          )}
        </div>
      </Card>
    </>
  );
}
