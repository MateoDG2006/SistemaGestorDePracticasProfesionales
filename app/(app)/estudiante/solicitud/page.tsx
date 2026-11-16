"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  actualizarSolicitud,
  ApiError,
  crearSolicitud,
  enviarSolicitud,
  listarDocentes,
  misSolicitudes,
  subirDocumentoSolicitud,
} from "../../../_lib/api";
import { useSesion } from "../../../_lib/session-context";
import type { Docente, Solicitud, SolicitudInput } from "../../../_lib/types";
import {
  Button,
  Card,
  Mensaje,
  PageHeader,
  Spinner,
} from "../../../_components/ui";
import { ArchivoPdf, Campo, Checkbox, Input, Select, TextArea } from "../../../_components/form";

type Errores = Record<string, string>;
const vacio: SolicitudInput = {
  empresaNombre: "", empresaDireccion: "", supervisorNombre: "", supervisorCargo: "",
  supervisorCorreo: "", supervisorTelefono: "", objetivo: "", actividades: "",
  fechaInicio: "", fechaFin: "", asesorSugeridoId: null, consentimientoDatos: false,
};

export default function PaginaSolicitud() {
  const router = useRouter();
  const { usuario } = useSesion();
  const [cargando, setCargando] = useState(true);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [id, setId] = useState<string | null>(null);
  const [bloqueada, setBloqueada] = useState<Solicitud | null>(null);
  const [f, setF] = useState<SolicitudInput>(vacio);
  const [notaActual, setNotaActual] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [guardando, setGuardando] = useState<"" | "borrador" | "envio">("");

  useEffect(() => {
    Promise.all([listarDocentes(), misSolicitudes()]).then(([docs, mias]) => {
      setDocentes(docs);
      const editable = mias.find((s) => ["BORRADOR", "DEVUELTA"].includes(s.estado));
      const enTramite = mias.find((s) => ["ENVIADA", "APROBADA"].includes(s.estado));
      if (editable) {
        setId(editable.id);
        setNotaActual(editable.notaAceptacion?.nombreOriginal ?? null);
        setF({
          empresaNombre: editable.empresaNombre, empresaDireccion: editable.empresaDireccion,
          supervisorNombre: editable.supervisorNombre, supervisorCargo: editable.supervisorCargo,
          supervisorCorreo: editable.supervisorCorreo, supervisorTelefono: editable.supervisorTelefono,
          objetivo: editable.objetivo, actividades: editable.actividades,
          fechaInicio: editable.fechaInicio ?? "", fechaFin: editable.fechaFin ?? "",
          asesorSugeridoId: editable.asesorSugeridoId, consentimientoDatos: editable.consentimientoDatos,
        });
        if (editable.estado === "DEVUELTA" && editable.ultimaObservacion) {
          setAviso({ tipo: "error", texto: `Devuelta por el Vicedecanato: ${editable.ultimaObservacion}` });
        }
      } else if (enTramite) {
        setBloqueada(enTramite);
      }
      setCargando(false);
    });
  }, []);

  const set = (k: keyof SolicitudInput, v: string | boolean | null) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const opcionesAsesor = useMemo(
    () => [{ valor: "", etiqueta: "— Ninguno —" }, ...docentes.map((d) => ({ valor: d.id, etiqueta: d.nombre }))],
    [docentes],
  );

  async function guardar(enviar: boolean) {
    setErrores({});
    setAviso(null);
    setGuardando(enviar ? "envio" : "borrador");
    try {
      // 1) Crear o actualizar la solicitud.
      let solId = id;
      if (!solId) {
        const creada = await crearSolicitud(f);
        solId = creada.id;
        setId(creada.id);
      } else {
        await actualizarSolicitud(solId, f);
      }
      // 2) Subir el PDF si se seleccionó uno nuevo (puede lanzar 413/415).
      if (archivo) {
        try {
          const ref = await subirDocumentoSolicitud(solId, "NOTA_ACEPTACION", archivo);
          setNotaActual(ref.nombreOriginal);
          setArchivo(null);
        } catch (e) {
          if (e instanceof ApiError) {
            setErrores({ notaAceptacion: e.message });
            setGuardando("");
            return;
          }
          throw e;
        }
      }
      // 3) Enviar, o terminar como borrador.
      if (enviar) {
        const env = await enviarSolicitud(solId);
        router.push(`/estudiante/solicitudes?enviada=${encodeURIComponent(env.numero ?? "")}`);
        return;
      }
      setAviso({ tipo: "ok", texto: "Borrador guardado." });
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.campos?.length) {
          const map: Errores = {};
          e.campos.forEach((c) => (map[c.campo] = c.error));
          setErrores(map);
          setAviso({ tipo: "error", texto: "Revise los campos marcados." });
        } else {
          setAviso({ tipo: "error", texto: e.message });
        }
      } else {
        setAviso({ tipo: "error", texto: "Ocurrió un error inesperado." });
      }
    } finally {
      setGuardando("");
    }
  }

  if (cargando) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }

  if (bloqueada) {
    return (
      <>
        <PageHeader saludo="Nueva solicitud" />
        <Mensaje tipo="error">
          Ya tiene una solicitud en trámite (<b>{bloqueada.numero}</b> – {bloqueada.estado}). No puede
          crear otra mientras esta siga en curso (RN-02).
        </Mensaje>
        <Button variante="secundario" href="/estudiante/solicitudes">Ver mis solicitudes</Button>
      </>
    );
  }

  return (
    <>
      <PageHeader saludo={id ? "Editar solicitud" : "Nueva solicitud"} />
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}

      <Card className="p-6">
        <div className="flex flex-col gap-7">
          {/* Estudiante (solo lectura) */}
          <Seccion titulo="Estudiante">
            <div className="rounded-[var(--radius-panel)] bg-surface-muted px-4 py-3 text-sm text-ink-soft">
              <span className="font-medium text-ink">{usuario?.nombre}</span> · {usuario?.correo} · Cédula 8-000-0000
              <br />Lic. en Ingeniería de Sistemas y Computación
            </div>
          </Seccion>

          {/* Empresa */}
          <Seccion titulo="Empresa">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre" error={errores.empresaNombre}>
                <Input value={f.empresaNombre} onChange={(v) => set("empresaNombre", v)} error={errores.empresaNombre} />
              </Campo>
              <Campo etiqueta="Dirección">
                <Input value={f.empresaDireccion} onChange={(v) => set("empresaDireccion", v)} />
              </Campo>
            </div>
          </Seccion>

          {/* Supervisor */}
          <Seccion titulo="Supervisor propuesto">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Nombre" error={errores.supervisorNombre}>
                <Input value={f.supervisorNombre} onChange={(v) => set("supervisorNombre", v)} error={errores.supervisorNombre} />
              </Campo>
              <Campo etiqueta="Cargo">
                <Input value={f.supervisorCargo} onChange={(v) => set("supervisorCargo", v)} />
              </Campo>
              <Campo etiqueta="Correo" error={errores.supervisorCorreo}>
                <Input value={f.supervisorCorreo} onChange={(v) => set("supervisorCorreo", v)} type="email" error={errores.supervisorCorreo} />
              </Campo>
              <Campo etiqueta="Teléfono">
                <Input value={f.supervisorTelefono} onChange={(v) => set("supervisorTelefono", v)} />
              </Campo>
            </div>
          </Seccion>

          {/* Programa */}
          <Seccion titulo="Programa de práctica">
            <div className="grid gap-4">
              <Campo etiqueta="Objetivo" error={errores.objetivo}>
                <TextArea value={f.objetivo} onChange={(v) => set("objetivo", v)} rows={2} error={errores.objetivo} />
              </Campo>
              <Campo etiqueta="Actividades" error={errores.actividades}>
                <TextArea value={f.actividades} onChange={(v) => set("actividades", v)} rows={3} error={errores.actividades} />
              </Campo>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Fecha de inicio" error={errores.fechaInicio}>
                  <Input value={f.fechaInicio} onChange={(v) => set("fechaInicio", v)} type="date" error={errores.fechaInicio} />
                </Campo>
                <Campo etiqueta="Fecha de fin" error={errores.fechaFin} hint="Duración mínima: 6 meses (RN-03).">
                  <Input value={f.fechaFin} onChange={(v) => set("fechaFin", v)} type="date" error={errores.fechaFin} />
                </Campo>
              </div>
              <Campo etiqueta="Asesor sugerido (opcional)">
                <Select
                  value={f.asesorSugeridoId ?? ""}
                  onChange={(v) => set("asesorSugeridoId", v || null)}
                  opciones={opcionesAsesor}
                />
              </Campo>
            </div>
          </Seccion>

          {/* Documentos */}
          <Seccion titulo="Documentos">
            <Campo etiqueta="Nota de aceptación (PDF ≤ 10 MB)" error={errores.notaAceptacion}>
              <ArchivoPdf onSelect={setArchivo} actual={notaActual} error={errores.notaAceptacion} />
            </Campo>
          </Seccion>

          {/* Consentimiento */}
          <div className={`rounded-[var(--radius-panel)] border p-4 ${errores.consentimientoDatos ? "border-[#616161]" : "border-border"}`}>
            <Checkbox checked={f.consentimientoDatos} onChange={(v) => set("consentimientoDatos", v)}>
              Acepto el tratamiento de mis datos personales (Ley 81 de 2019).
            </Checkbox>
            {errores.consentimientoDatos && (
              <p className="mt-1 text-xs font-medium text-[#616161]">⚠ {errores.consentimientoDatos}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Button variante="secundario" disabled={!!guardando} onClick={() => guardar(false)}>
              {guardando === "borrador" ? <Spinner className="h-4 w-4" /> : "Guardar borrador"}
            </Button>
            <Button disabled={!!guardando} onClick={() => guardar(true)}>
              {guardando === "envio" ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : "Enviar solicitud"}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft">{titulo}</h3>
      {children}
    </section>
  );
}
