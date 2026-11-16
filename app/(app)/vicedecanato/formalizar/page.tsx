"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  formalizarPractica,
  listarDocentes,
  solicitudesAprobadas,
} from "../../../_lib/api";
import type { Docente, Solicitud } from "../../../_lib/types";
import { fecha } from "../../../_lib/format";
import {
  Button,
  Card,
  EmptyState,
  EsqueletoFormulario,
  Mensaje,
  PageHeader,
  SectionTitle,
  Spinner,
} from "../../../_components/ui";
import { ArchivoPdf, Campo, Input, Select } from "../../../_components/form";
import { CANTIDAD_PERIODOS, textoDuracionMinima, textoLimitePdf } from "@/src/shared/dominio/reglas";

type Errores = Record<string, string>;

export default function Formalizar() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [aprobadas, setAprobadas] = useState<Solicitud[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [selId, setSelId] = useState("");
  const [asesorId, setAsesorId] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [fi, setFi] = useState("");
  const [ff, setFf] = useState("");
  const [convenio, setConvenio] = useState<File | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    Promise.all([solicitudesAprobadas(), listarDocentes()]).then(([aps, docs]) => {
      setAprobadas(aps);
      setDocentes(docs);
      if (aps[0]) seleccionar(aps[0], docs);
      setCargando(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function seleccionar(s: Solicitud, docs: Docente[]) {
    setSelId(s.id);
    setAsesorId(s.asesorSugeridoId ?? docs[0]?.id ?? "");
    setSupervisor(s.supervisorCorreo);
    setFi(s.fechaInicio ?? "");
    setFf(s.fechaFin ?? "");
    setConvenio(null);
    setErrores({});
  }

  const sel = useMemo(() => aprobadas.find((s) => s.id === selId), [aprobadas, selId]);

  async function formalizar() {
    if (!sel) return;
    setErrores({});
    setAviso(null);
    setEnviando(true);
    try {
      if (!convenio) {
        setErrores({ convenio: "El convenio es obligatorio." });
        setAviso("Revise los campos marcados.");
        setEnviando(false);
        return;
      }
      await formalizarPractica({
        solicitudId: sel.id,
        asesorId,
        supervisorCorreo: supervisor,
        fechaInicio: fi,
        fechaFin: ff,
      }, convenio);
      router.push("/vicedecanato/practicas?formalizada=1");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.campos?.length) {
          const map: Errores = {};
          e.campos.forEach((c) => (map[c.campo] = c.error));
          setErrores(map);
          setAviso("Revise los campos marcados.");
        } else {
          setAviso(e.message);
        }
      }
      setEnviando(false);
    }
  }

  if (cargando) return <EsqueletoFormulario />;

  return (
    <>
      <PageHeader saludo="Formalizar práctica" />
      {aviso && <Mensaje tipo="error">{aviso}</Mensaje>}

      {!aprobadas.length ? (
        <Card className="p-5">
          <EmptyState>No hay solicitudes aprobadas pendientes de formalizar.</EmptyState>
        </Card>
      ) : (
        <Card className="p-6">
          <SectionTitle titulo="Datos de la práctica" subtitulo={`Se generarán ${CANTIDAD_PERIODOS} períodos mensuales y la invitación al supervisor`} />
          <div className="mt-5 grid gap-4">
            <Campo etiqueta="Solicitud aprobada">
              <Select
                value={selId}
                onChange={(v) => {
                  const s = aprobadas.find((x) => x.id === v);
                  if (s) seleccionar(s, docentes);
                }}
                opciones={aprobadas.map((s) => ({ valor: s.id, etiqueta: `${s.numero} – ${s.estudianteNombre} · ${s.empresaNombre}` }))}
              />
            </Campo>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Asesor asignado" error={errores.asesorId}>
                <Select
                  value={asesorId}
                  onChange={setAsesorId}
                  opciones={docentes.map((d) => ({ valor: d.id, etiqueta: `${d.nombre} (${d.correo})` }))}
                />
              </Campo>
              <Campo etiqueta="Correo del supervisor" error={errores.supervisorCorreo}>
                <Input value={supervisor} onChange={setSupervisor} type="email" error={errores.supervisorCorreo} />
              </Campo>
              <Campo etiqueta="Fecha de inicio">
                <Input value={fi} onChange={setFi} type="date" />
              </Campo>
              <Campo etiqueta="Fecha de fin" error={errores.fechaFin} hint={textoDuracionMinima()}>
                <Input value={ff} onChange={setFf} type="date" error={errores.fechaFin} />
              </Campo>
            </div>

            <Campo etiqueta={`Convenio firmado (PDF ≤ ${textoLimitePdf()})`} error={errores.convenio}>
              <ArchivoPdf onSelect={setConvenio} error={errores.convenio} />
            </Campo>

            {sel && (
              <div className="rounded-[var(--radius-panel)] bg-surface-muted px-4 py-3 text-sm text-ink-soft">
                Estudiante: <span className="font-medium text-ink">{sel.estudianteNombre}</span> · Empresa:{" "}
                <span className="font-medium text-ink">{sel.empresaNombre}</span> · Periodo propuesto:{" "}
                {fecha(fi)} – {fecha(ff)}
              </div>
            )}

            <div className="border-t border-border pt-5">
              <Button disabled={enviando} onClick={formalizar}>
                {enviando ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : "Formalizar práctica"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
