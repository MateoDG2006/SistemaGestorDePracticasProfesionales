// Cliente API tipado del frontend.
//
// Modo de operación controlado por NEXT_PUBLIC_API_MODE:
//   - "real" (producción): llama a los endpoints REST del backend (Tabla 20).
//   - "mock" (demo/desarrollo): usa datos en memoria del navegador, sin red.
//     Es un apoyo SOLO del frontend para ver la interfaz sin el backend; no son
//     route handlers ni tocan el dominio. Para integrar, poné NEXT_PUBLIC_API_MODE=real.
//
// Todos los errores del backend llegan en el formato común { codigo, mensaje, campos[] }
// (Fase 2, §6.1) y se re-lanzan como ApiError, que la UI interpreta por código.

import type {
  Auditoria,
  Docente,
  DocumentoRef,
  EvaluacionInput,
  Invitacion,
  Notificacion,
  Practica,
  PracticaInput,
  Solicitud,
  SolicitudInput,
  Usuario,
} from "./types";

export const API_MODE =
  (process.env.NEXT_PUBLIC_API_MODE as "real" | "mock" | undefined) ?? "mock";

export interface CampoError {
  campo: string;
  error: string;
}

export class ApiError extends Error {
  readonly codigo: string;
  readonly status: number;
  readonly campos?: CampoError[];
  constructor(codigo: string, status: number, mensaje: string, campos?: CampoError[]) {
    super(mensaje);
    this.name = "ApiError";
    this.codigo = codigo;
    this.status = status;
    this.campos = campos;
  }
  /** Devuelve el mensaje de error de un campo concreto, si existe. */
  campo(nombre: string): string | undefined {
    return this.campos?.find((c) => c.campo === nombre)?.error;
  }
}

interface Opciones {
  method?: string;
  body?: unknown;
  form?: FormData;
}

async function pedir<T>(path: string, opc: Opciones = {}): Promise<T> {
  const init: RequestInit = {
    method: opc.method ?? "GET",
    credentials: "include",
    headers: {},
  };
  if (opc.form) {
    init.body = opc.form; // multipart/form-data (el navegador fija el boundary)
  } else if (opc.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(opc.body);
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError("SIN_CONEXION", 0, "No se pudo contactar al servidor.");
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  const texto = await res.text();
  if (texto) {
    try {
      data = JSON.parse(texto);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const cuerpo = (data ?? {}) as {
      codigo?: string;
      mensaje?: string;
      campos?: CampoError[];
    };
    throw new ApiError(
      cuerpo.codigo ?? "ERROR",
      res.status,
      cuerpo.mensaje ?? "Ocurrió un error inesperado.",
      cuerpo.campos,
    );
  }
  return data as T;
}

// Puente al adaptador mock (solo en modo demo).
async function mock() {
  const m = await import("./mock");
  return m.mockApi;
}

/* ======================= Identidad / sesión ======================= */

export async function iniciarSesion(correo: string, password: string): Promise<Usuario> {
  if (API_MODE === "mock") return (await mock()).iniciarSesion(correo, password);
  return pedir<Usuario>("/sesiones", { method: "POST", body: { correo, password } });
}

export async function cerrarSesion(): Promise<void> {
  if (API_MODE === "mock") return (await mock()).cerrarSesion();
  await pedir<void>("/sesiones", { method: "DELETE" });
}

// Nota: endpoint propuesto (no está en la Tabla 20). Devuelve el usuario de la
// sesión vigente o null. El backend debe exponer GET /api/sesiones/actual.
export async function sesionActual(): Promise<Usuario | null> {
  if (API_MODE === "mock") return (await mock()).sesionActual();
  try {
    return await pedir<Usuario>("/sesiones/actual");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 404)) return null;
    throw e;
  }
}

export async function listarDocentes(): Promise<Docente[]> {
  if (API_MODE === "mock") return (await mock()).listarDocentes();
  return pedir<Docente[]>("/docentes");
}

/* ======================= CU-01 Solicitudes (estudiante) ======================= */

export async function crearSolicitud(input: SolicitudInput): Promise<Solicitud> {
  if (API_MODE === "mock") return (await mock()).crearSolicitud(input);
  return pedir<Solicitud>("/solicitudes", { method: "POST", body: input });
}

export async function actualizarSolicitud(
  id: string,
  input: SolicitudInput,
): Promise<Solicitud> {
  if (API_MODE === "mock") return (await mock()).actualizarSolicitud(id, input);
  return pedir<Solicitud>(`/solicitudes/${id}`, { method: "PUT", body: input });
}

export async function misSolicitudes(): Promise<Solicitud[]> {
  if (API_MODE === "mock") return (await mock()).misSolicitudes();
  return pedir<Solicitud[]>("/solicitudes/mias");
}

export async function obtenerSolicitud(id: string): Promise<Solicitud> {
  if (API_MODE === "mock") return (await mock()).obtenerSolicitud(id);
  return pedir<Solicitud>(`/solicitudes/${id}`);
}

export async function subirDocumentoSolicitud(
  id: string,
  tipo: string,
  archivo: File,
): Promise<DocumentoRef> {
  if (API_MODE === "mock") return (await mock()).subirDocumentoSolicitud(id, tipo, archivo);
  const form = new FormData();
  form.append("tipo", tipo);
  form.append("archivo", archivo);
  return pedir<DocumentoRef>(`/solicitudes/${id}/documentos`, { method: "POST", form });
}

export async function enviarSolicitud(id: string): Promise<Solicitud> {
  if (API_MODE === "mock") return (await mock()).enviarSolicitud(id);
  return pedir<Solicitud>(`/solicitudes/${id}/envio`, { method: "POST" });
}

/* ======================= CU-02 Evaluación (vicedecanato) ======================= */

export async function bandejaSolicitudes(): Promise<Solicitud[]> {
  if (API_MODE === "mock") return (await mock()).bandejaSolicitudes();
  return pedir<Solicitud[]>("/solicitudes?estado=ENVIADA");
}

export async function evaluarSolicitud(
  id: string,
  input: EvaluacionInput,
): Promise<Solicitud> {
  if (API_MODE === "mock") return (await mock()).evaluarSolicitud(id, input);
  return pedir<Solicitud>(`/solicitudes/${id}/evaluaciones`, { method: "POST", body: input });
}

/* ======================= CU-03 Prácticas ======================= */

export async function solicitudesAprobadas(): Promise<Solicitud[]> {
  if (API_MODE === "mock") return (await mock()).solicitudesAprobadas();
  return pedir<Solicitud[]>("/solicitudes?estado=APROBADA&sinPractica=true");
}

export async function formalizarPractica(input: PracticaInput): Promise<Practica> {
  if (API_MODE === "mock") return (await mock()).formalizarPractica(input);
  return pedir<Practica>("/practicas", { method: "POST", body: input });
}

export async function listarPracticas(): Promise<Practica[]> {
  if (API_MODE === "mock") return (await mock()).listarPracticas();
  return pedir<Practica[]>("/practicas");
}

export async function reenviarInvitacion(practicaId: string): Promise<Invitacion> {
  if (API_MODE === "mock") return (await mock()).reenviarInvitacion(practicaId);
  return pedir<Invitacion>(`/practicas/${practicaId}/invitaciones/reenvio`, {
    method: "POST",
  });
}

/* ======================= Supervisor ======================= */

// Nota: la Tabla 20 define la aceptación por token (enlace del correo). Para la
// bandeja del supervisor en la UI se asume GET /api/invitaciones/mias.
export async function invitacionesSupervisor(): Promise<Invitacion[]> {
  if (API_MODE === "mock") return (await mock()).invitacionesSupervisor();
  return pedir<Invitacion[]>("/invitaciones/mias");
}

export async function aceptarInvitacion(token: string): Promise<void> {
  if (API_MODE === "mock") return (await mock()).aceptarInvitacion(token);
  await pedir<void>(`/invitaciones/${token}/aceptacion`, { method: "POST" });
}

/* ======================= Soporte: notificaciones y auditoría ======================= */
// Endpoints propuestos (no están en la Tabla 20); el backend debe exponerlos.

export async function listarNotificaciones(): Promise<Notificacion[]> {
  if (API_MODE === "mock") return (await mock()).listarNotificaciones();
  return pedir<Notificacion[]>("/notificaciones");
}

export async function listarAuditoria(): Promise<Auditoria[]> {
  if (API_MODE === "mock") return (await mock()).listarAuditoria();
  return pedir<Auditoria[]>("/auditoria");
}
