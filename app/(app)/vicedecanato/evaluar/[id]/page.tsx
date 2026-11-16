"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ApiError,
  API_MODE,
  evaluarSolicitud,
  listarDocentes,
  obtenerSolicitud,
  subirDocumentoSolicitud,
} from "../../../../_lib/api";
import type { Decision, Docente, EvaluacionInput, Solicitud } from "../../../../_lib/types";
import { fecha } from "../../../../_lib/format";
import {
  Button,
  Card,
  ChipSolicitud,
  EsqueletoFormulario,
  Mensaje,
  PageHeader,
  SectionTitle,
  Spinner,
} from "../../../../_components/ui";
import { ArchivoPdf, Campo, Checkbox, Input, TextArea } from "../../../../_components/form";
import { puedeEvaluar, textoLimitePdf } from "@/src/shared/dominio/reglas";
import { TipoDocumento } from "@/src/shared/dominio/enums";

type Errores = Record<string, string>;

export default function Evaluar() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [sol, setSol] = useState<Solicitud | null>(null);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [noExiste, setNoExiste] = useState(false);

  // Verificación RN-01
  const [v1, setV1] = useState(false);
  const [v2, setV2] = useState(false);
  const [v3, setV3] = useState(false);
  const [jefe, setJefe] = useState("");
  const [fechaJefe, setFechaJefe] = useState("");
  const [comision, setComision] = useState<File | null>(null);
  const [obs, setObs] = useState("");

  const [errores, setErrores] = useState<Errores>({});
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [procesando, setProcesando] = useState<Decision | "">("");

  const cargar = useCallback(() => {
    obtenerSolicitud(id)
      .then(setSol)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNoExiste(true);
      });
  }, [id]);

  useEffect(() => {
    cargar();
    listarDocentes().then(setDocentes).catch(() => {});
  }, [cargar]);

  async function decidir(decision: Decision) {
    if (!sol) return;
    setErrores({});
    setAviso(null);
    setProcesando(decision);
    try {
      let documentoComisionId: string | null = null;
      if (comision) {
        documentoComisionId =
          API_MODE === "real"
            ? (await subirDocumentoSolicitud(sol.id, TipoDocumento.RECOMENDACION_COMISION, comision)).id
            : `com-${comision.name}`;
      }
      const input: EvaluacionInput = {
        decision,
        version: sol.version, // control de concurrencia optimista (CU-02 E3)
        asignaturasAprobadas: v1,
        indiceMinimo: v2,
        documentacionCompleta: v3,
        jefeDepartamento: jefe,
        fechaAprobacionJefe: fechaJefe,
        documentoComisionId,
        observaciones: obs,
      };
      const res = await evaluarSolicitud(sol.id, input);
      const txt =
        res.estado === "APROBADA" ? "aprobada" : res.estado === "DEVUELTA" ? "devuelta" : "rechazada";
      router.push(`/vicedecanato?decidida=${res.numero}&estado=${txt}`);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 409) {
          setAviso({ tipo: "error", texto: e.message });
          cargar(); // recarga el estado/versión actual
        } else if (e.campos?.length) {
          const map: Errores = {};
          e.campos.forEach((c) => (map[c.campo] = c.error));
          setErrores(map);
          setAviso({ tipo: "error", texto: "Revise la verificación requerida." });
        } else {
          setAviso({ tipo: "error", texto: e.message });
        }
      }
    } finally {
      setProcesando("");
    }
  }

  if (noExiste) {
    return (
      <>
        <PageHeader saludo="Evaluar solicitud" />
        <Mensaje tipo="error">La solicitud no existe o ya no está disponible.</Mensaje>
        <Button variante="secundario" href="/vicedecanato">Volver a la bandeja</Button>
      </>
    );
  }
  if (!sol) {
    return <EsqueletoFormulario />;
  }

  const asesor = docentes.find((d) => d.id === sol.asesorSugeridoId);
  const yaResuelta = !puedeEvaluar(sol.estado);

  return (
    <>
      <PageHeader saludo={`Evaluar ${sol.numero}`}>
        <Button variante="secundario" href="/vicedecanato">Volver</Button>
      </PageHeader>
      {aviso && <Mensaje tipo={aviso.tipo}>{aviso.texto}</Mensaje>}
      {yaResuelta && (
        <Mensaje tipo="info">
          Esta solicitud ya fue resuelta (<ChipSolicitud estado={sol.estado} />). No admite nuevas decisiones.
        </Mensaje>
      )}

      {/* Detalle de la solicitud */}
      <Card className="p-6">
        <SectionTitle titulo={sol.empresaNombre} subtitulo={sol.empresaDireccion} />
        <div className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <Dato k="Estudiante" v={sol.estudianteNombre} />
          <Dato k="Periodo" v={`${fecha(sol.fechaInicio)} – ${fecha(sol.fechaFin)}`} />
          <Dato k="Supervisor" v={`${sol.supervisorNombre} · ${sol.supervisorCargo}`} />
          <Dato k="Correo supervisor" v={sol.supervisorCorreo} />
          <Dato k="Asesor sugerido" v={asesor?.nombre ?? "Ninguno"} />
          <Dato k="Nota de aceptación" v={sol.notaAceptacion?.nombreOriginal ?? "—"} />
        </div>
        <div className="mt-4 space-y-2 text-sm">
          <p><span className="font-medium text-ink">Objetivo:</span> <span className="text-ink-soft">{sol.objetivo}</span></p>
          <p><span className="font-medium text-ink">Actividades:</span> <span className="text-ink-soft">{sol.actividades}</span></p>
        </div>
      </Card>

      {/* Verificación */}
      <Card className="p-6">
        <SectionTitle titulo="Verificación de requisitos" subtitulo="Art. 41 · RN-01" />
        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <Checkbox checked={v1} onChange={setV1}>Asignaturas aprobadas</Checkbox>
            <Checkbox checked={v2} onChange={setV2}>Índice mínimo</Checkbox>
            <Checkbox checked={v3} onChange={setV3}>Documentación completa</Checkbox>
            {(errores.asignaturasAprobadas || errores.indiceMinimo || errores.documentacionCompleta) && (
              <p className="text-xs font-medium text-[#616161]">
                ⚠ {errores.asignaturasAprobadas || errores.indiceMinimo || errores.documentacionCompleta}
              </p>
            )}
          </div>
          <div className="grid gap-4">
            <Campo etiqueta="Jefe de Departamento" error={errores.jefeDepartamento}>
              <Input value={jefe} onChange={setJefe} error={errores.jefeDepartamento} />
            </Campo>
            <Campo etiqueta="Fecha de aprobación del Jefe" error={errores.fechaAprobacionJefe}>
              <Input value={fechaJefe} onChange={setFechaJefe} type="date" error={errores.fechaAprobacionJefe} />
            </Campo>
          </div>
        </div>
        <div className="mt-4 grid gap-4">
          <Campo etiqueta={`Recomendación de la Comisión (PDF ≤ ${textoLimitePdf()})`} error={errores.documentoComision}>
            <ArchivoPdf onSelect={setComision} error={errores.documentoComision} />
          </Campo>
          <Campo etiqueta="Observaciones / motivo (obligatorio al devolver o rechazar)" error={errores.observaciones}>
            <TextArea value={obs} onChange={setObs} rows={3} error={errores.observaciones} />
          </Campo>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-5">
          <Button disabled={yaResuelta || !!procesando} onClick={() => decidir("APROBAR")}>
            {procesando === "APROBAR" ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : "Aprobar"}
          </Button>
          <Button variante="secundario" disabled={yaResuelta || !!procesando} onClick={() => decidir("DEVOLVER")}>
            {procesando === "DEVOLVER" ? <Spinner className="h-4 w-4" /> : "Devolver"}
          </Button>
          <Button variante="peligro" disabled={yaResuelta || !!procesando} onClick={() => decidir("RECHAZAR")}>
            {procesando === "RECHAZAR" ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : "Rechazar"}
          </Button>
        </div>
      </Card>
    </>
  );
}

function Dato({ k, v }: { k: string; v: string }) {
  return (
    <p>
      <span className="text-ink-soft">{k}:</span> <span className="font-medium text-ink">{v}</span>
    </p>
  );
}
