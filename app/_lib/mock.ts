// Adaptador de datos de DEMOSTRACIÓN (solo frontend).
//
// Reproduce en memoria el comportamiento del prototipo y las validaciones del
// dominio (RN-02, RN-03, RN-04, PDF, concurrencia optimista) para que la
// interfaz sea navegable SIN el backend. No es un route handler ni toca Prisma.
// Se activa con NEXT_PUBLIC_API_MODE=mock. En modo "real" nada de esto se usa.

import { ApiError } from "./api";
import type {
  Auditoria,
  Decision,
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

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB (RNF-09)
const uid = () => Math.random().toString(36).slice(2, 10);
const hoy = () => new Date().toISOString().slice(0, 10);

/* ---------- utilidades de fecha (igual que el prototipo) ---------- */
function addMonths(s: string, n: number): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));
  dt.setUTCMonth(dt.getUTCMonth() + n);
  const ult = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate();
  dt.setUTCDate(Math.min(d, ult));
  return dt.toISOString().slice(0, 10);
}
function addDays(s: string, n: number): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
function duracionOk(i: string, f: string): boolean {
  return Boolean(i && f && f >= addMonths(i, 6));
}

/* ---------- "base de datos" en memoria ---------- */
interface UsuarioMock extends Usuario {
  password: string;
}

const DOCENTES: Docente[] = [
  { id: "a1", nombre: "Dr. Carlos Mora", correo: "asesor1@utp.ac.pa" },
  { id: "a2", nombre: "Dra. Luisa Rivas", correo: "asesor2@utp.ac.pa" },
];

const USUARIOS: UsuarioMock[] = [
  { id: "est1", nombre: "Ana Pérez", correo: "estudiante@utp.ac.pa", rol: "ESTUDIANTE", password: "demo" },
  { id: "vice1", nombre: "Vicedecanato FISC", correo: "vicedecanato@utp.ac.pa", rol: "VICEDECANATO", password: "demo" },
  { id: "sup1", nombre: "Ing. Roberto Sánchez", correo: "supervisor@empresa.com", rol: "SUPERVISOR", password: "demo" },
];

interface Estado {
  solicitudes: Solicitud[];
  practicas: Practica[];
  notificaciones: Notificacion[];
  auditoria: Auditoria[];
  // token de invitación -> id de práctica (para aceptación por token)
  tokens: Record<string, string>;
}

function plantillaSolicitud(parcial: Partial<Solicitud>): Solicitud {
  return {
    id: uid(),
    numero: null,
    estado: "BORRADOR",
    version: 0,
    estudianteNombre: "Ana Pérez",
    estudianteCorreo: "estudiante@utp.ac.pa",
    cedula: "8-000-0000",
    carrera: "Lic. en Ingeniería de Sistemas y Computación",
    empresaNombre: "",
    empresaDireccion: "",
    supervisorNombre: "",
    supervisorCargo: "",
    supervisorCorreo: "",
    supervisorTelefono: "",
    objetivo: "",
    actividades: "",
    fechaInicio: null,
    fechaFin: null,
    asesorSugeridoId: null,
    consentimientoDatos: false,
    notaAceptacion: null,
    enviadaEn: null,
    ultimaObservacion: null,
    ...parcial,
  };
}

function periodos(ini: string, fin: string) {
  const r = [];
  for (let i = 1; i <= 6; i++) {
    const inicio = addMonths(ini, i - 1);
    const cierre = i < 6 ? addDays(addMonths(ini, i), -1) : fin;
    r.push({ numero: i, fechaInicio: inicio, fechaCierre: cierre, venceInforme: addDays(cierre, 15) });
  }
  return r;
}

// Estado inicial sembrado (persiste durante la sesión del navegador).
function sembrar(): Estado {
  const doc = (nombre: string): DocumentoRef => ({ id: uid(), nombreOriginal: nombre, tamanoBytes: 240_000 });
  const solBase = {
    empresaDireccion: "Vía España, Ciudad de Panamá",
    supervisorCargo: "Jefe de Desarrollo",
    supervisorTelefono: "6000-0000",
    objetivo: "Apoyar el desarrollo de módulos del sistema interno.",
    actividades: "Programación, pruebas y documentación técnica.",
    fechaInicio: "2027-01-04",
    fechaFin: "2027-07-04",
    consentimientoDatos: true,
    notaAceptacion: doc("nota_aceptacion.pdf"),
  };

  const solucitudes: Solicitud[] = [
    // Solicitud devuelta de Ana (login estudiante): editable, muestra corrección.
    plantillaSolicitud({
      id: "sol-ana", numero: "SOL-2026-0007", estado: "DEVUELTA", version: 2,
      empresaNombre: "Tech Solutions S.A.", ...solBase,
      asesorSugeridoId: "a1",
      ultimaObservacion: "Corrija el objetivo: debe detallar las competencias a desarrollar.",
    }),
    // Bandeja del vicedecanato (ENVIADA de otros estudiantes).
    plantillaSolicitud({
      id: "sol-luis", numero: "SOL-2026-0008", estado: "ENVIADA", version: 1,
      estudianteNombre: "Luis González", estudianteCorreo: "luis.g@utp.ac.pa",
      empresaNombre: "Innova Panamá", ...solBase, asesorSugeridoId: "a2",
      enviadaEn: "2026-11-10T14:20:00.000Z",
    }),
    plantillaSolicitud({
      id: "sol-maria", numero: "SOL-2026-0009", estado: "ENVIADA", version: 1,
      estudianteNombre: "María Castillo", estudianteCorreo: "maria.c@utp.ac.pa",
      empresaNombre: "Banco Nacional", ...solBase, asesorSugeridoId: "a1",
      enviadaEn: "2026-11-12T09:05:00.000Z",
    }),
    // Aprobada sin práctica (para formalizar, CU-03).
    plantillaSolicitud({
      id: "sol-pedro", numero: "SOL-2026-0005", estado: "APROBADA", version: 3,
      estudianteNombre: "Pedro Ríos", estudianteCorreo: "pedro.r@utp.ac.pa",
      empresaNombre: "Soluciones TI", ...solBase, asesorSugeridoId: "a2",
      enviadaEn: "2026-11-02T10:00:00.000Z",
    }),
  ];

  const pini = "2026-12-01", pfin = "2027-06-01";
  const invToken = uid() + uid();
  const practicas: Practica[] = [
    {
      id: "prac-1", numeroSolicitud: "SOL-2026-0003", estado: "POR_INICIAR",
      estudianteNombre: "Jorge Herrera", asesorNombre: "Dr. Carlos Mora",
      supervisorCorreo: "supervisor@empresa.com", supervisorVinculado: false,
      fechaInicio: pini, fechaFin: pfin, convenio: doc("convenio_firmado.pdf"),
      periodos: periodos(pini, pfin),
      invitacion: {
        id: "inv-1", correoDestino: "supervisor@empresa.com",
        venceEn: new Date(Date.now() + 72 * 3600e3).toISOString(), estado: "PENDIENTE",
      },
    },
  ];

  return {
    solicitudes: solucitudes,
    practicas,
    tokens: { [invToken]: "prac-1" },
    notificaciones: [
      { id: uid(), tipoEvento: "SolicitudEnviada", mensaje: "Nueva solicitud SOL-2026-0008 de Luis González", leida: false, creadaEn: "2026-11-10T14:20:00.000Z", estadoOutbox: "ENVIADO" },
      { id: uid(), tipoEvento: "PracticaFormalizada", mensaje: "Invitación para supervisar la práctica de Jorge Herrera (vence en 72 h).", leida: false, creadaEn: "2026-11-13T11:00:00.000Z", estadoOutbox: "PENDIENTE" },
    ],
    auditoria: [
      { id: 1, usuario: "Luis González", accion: "ENVIAR_SOLICITUD", entidad: "solicitud", ocurridoEn: "2026-11-10 09:20" },
      { id: 2, usuario: "Vicedecanato FISC", accion: "EVALUAR_APROBAR", entidad: "solicitud", ocurridoEn: "2026-11-11 15:40" },
      { id: 3, usuario: "Vicedecanato FISC", accion: "FORMALIZAR_PRACTICA", entidad: "practica", ocurridoEn: "2026-11-13 11:00" },
    ],
  };
}

const STORE_KEY = "sgpp_mock_store";
const USER_KEY = "sgpp_mock_user";

let memoria: Estado | null = null;
function store(): Estado {
  if (memoria) return memoria;
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      try {
        memoria = JSON.parse(raw) as Estado;
        return memoria;
      } catch {
        /* ignora */
      }
    }
  }
  memoria = sembrar();
  persistir();
  return memoria;
}
function persistir() {
  if (typeof window !== "undefined" && memoria) {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(memoria));
  }
}

function usuarioGuardado(): Usuario | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as Usuario) : null;
}

function auditar(usuario: string, accion: string, entidad: string) {
  const s = store();
  s.auditoria.push({ id: s.auditoria.length + 1, usuario, accion, entidad, ocurridoEn: new Date().toLocaleString("es-PA") });
}
function notificar(tipoEvento: string, mensaje: string) {
  store().notificaciones.unshift({ id: uid(), tipoEvento, mensaje, leida: false, creadaEn: new Date().toISOString(), estadoOutbox: "PENDIENTE" });
}

const demora = () => new Promise((r) => setTimeout(r, 180));

export const mockApi = {
  async iniciarSesion(correo: string, password: string): Promise<Usuario> {
    await demora();
    const u = USUARIOS.find((x) => x.correo.toLowerCase() === correo.trim().toLowerCase());
    if (!u || (password && u.password !== password && password !== "demo")) {
      throw new ApiError("NO_AUTENTICADO", 401, "Correo o contraseña incorrectos.");
    }
    const pub: Usuario = { id: u.id, nombre: u.nombre, correo: u.correo, rol: u.rol };
    if (typeof window !== "undefined") window.localStorage.setItem(USER_KEY, JSON.stringify(pub));
    return pub;
  },
  async cerrarSesion(): Promise<void> {
    if (typeof window !== "undefined") window.localStorage.removeItem(USER_KEY);
  },
  async sesionActual(): Promise<Usuario | null> {
    return usuarioGuardado();
  },
  async listarDocentes(): Promise<Docente[]> {
    return [...DOCENTES];
  },

  /* ----- CU-01 ----- */
  async misSolicitudes(): Promise<Solicitud[]> {
    await demora();
    // En demo, el estudiante logueado es Ana (sol-ana).
    return store().solicitudes.filter((s) => s.estudianteCorreo === "estudiante@utp.ac.pa");
  },
  async obtenerSolicitud(id: string): Promise<Solicitud> {
    const s = store().solicitudes.find((x) => x.id === id);
    if (!s) throw new ApiError("NO_ENCONTRADO", 404, "Solicitud no encontrada.");
    return { ...s };
  },
  async crearSolicitud(input: SolicitudInput): Promise<Solicitud> {
    await demora();
    // RN-02: una sola solicitud en trámite por estudiante.
    const enTramite = store().solicitudes.find(
      (s) => s.estudianteCorreo === "estudiante@utp.ac.pa" &&
        ["BORRADOR", "ENVIADA", "DEVUELTA", "APROBADA"].includes(s.estado),
    );
    if (enTramite) {
      throw new ApiError("CONFLICTO", 409, `Ya tiene una solicitud en trámite (${enTramite.numero ?? "borrador"} – ${enTramite.estado}). RN-02.`);
    }
    const s = plantillaSolicitud({ ...aplicar(input) });
    store().solicitudes.push(s);
    persistir();
    return { ...s };
  },
  async actualizarSolicitud(id: string, input: SolicitudInput): Promise<Solicitud> {
    await demora();
    const s = store().solicitudes.find((x) => x.id === id);
    if (!s) throw new ApiError("NO_ENCONTRADO", 404, "Solicitud no encontrada.");
    if (!["BORRADOR", "DEVUELTA"].includes(s.estado)) {
      throw new ApiError("CONFLICTO", 409, "La solicitud no es editable en su estado actual.");
    }
    Object.assign(s, aplicar(input));
    persistir();
    return { ...s };
  },
  async subirDocumentoSolicitud(id: string, _tipo: string, archivo: File): Promise<DocumentoRef> {
    await demora();
    validarPdf(archivo);
    const ref: DocumentoRef = { id: uid(), nombreOriginal: archivo.name, tamanoBytes: archivo.size };
    const s = store().solicitudes.find((x) => x.id === id);
    if (s) { s.notaAceptacion = ref; persistir(); }
    return ref;
  },
  async enviarSolicitud(id: string): Promise<Solicitud> {
    await demora();
    const s = store().solicitudes.find((x) => x.id === id);
    if (!s) throw new ApiError("NO_ENCONTRADO", 404, "Solicitud no encontrada.");

    const campos: { campo: string; error: string }[] = [];
    if (!s.empresaNombre) campos.push({ campo: "empresaNombre", error: "Campo obligatorio." });
    if (!s.supervisorNombre) campos.push({ campo: "supervisorNombre", error: "Campo obligatorio." });
    if (!s.supervisorCorreo) campos.push({ campo: "supervisorCorreo", error: "Campo obligatorio." });
    if (!s.objetivo) campos.push({ campo: "objetivo", error: "Campo obligatorio." });
    if (!s.actividades) campos.push({ campo: "actividades", error: "Campo obligatorio." });
    if (!s.fechaInicio) campos.push({ campo: "fechaInicio", error: "Campo obligatorio." });
    if (!s.fechaFin) campos.push({ campo: "fechaFin", error: "Campo obligatorio." });
    if (!s.notaAceptacion) campos.push({ campo: "notaAceptacion", error: "Falta la nota de aceptación en PDF." });
    if (!s.consentimientoDatos) campos.push({ campo: "consentimientoDatos", error: "Debe aceptar el tratamiento de datos (RNF-03)." });
    if (s.fechaInicio && s.fechaFin && !duracionOk(s.fechaInicio, s.fechaFin)) {
      campos.push({ campo: "fechaFin", error: "La duración mínima es de 6 meses (RN-03)." });
    }
    const asesor = DOCENTES.find((d) => d.id === s.asesorSugeridoId);
    if (asesor && s.supervisorCorreo && asesor.correo.toLowerCase() === s.supervisorCorreo.toLowerCase()) {
      campos.push({ campo: "supervisorCorreo", error: "El supervisor no puede ser el asesor (RN-04)." });
    }
    if (campos.length) throw new ApiError("VALIDACION", 422, "La solicitud tiene datos inválidos.", campos);

    s.estado = "ENVIADA";
    s.version += 1;
    s.enviadaEn = new Date().toISOString();
    if (!s.numero) s.numero = "SOL-2026-" + String(1000 + store().solicitudes.length).padStart(4, "0");
    auditar(s.estudianteNombre, "ENVIAR_SOLICITUD", "solicitud");
    notificar("SolicitudEnviada", `Nueva solicitud ${s.numero} de ${s.estudianteNombre}`);
    persistir();
    return { ...s };
  },

  /* ----- CU-02 ----- */
  async bandejaSolicitudes(): Promise<Solicitud[]> {
    await demora();
    return store().solicitudes
      .filter((s) => s.estado === "ENVIADA")
      .sort((a, b) => (a.enviadaEn ?? "").localeCompare(b.enviadaEn ?? ""));
  },
  async evaluarSolicitud(id: string, input: EvaluacionInput): Promise<Solicitud> {
    await demora();
    const s = store().solicitudes.find((x) => x.id === id);
    if (!s) throw new ApiError("NO_ENCONTRADO", 404, "Solicitud no encontrada.");
    // CU-02 E3: control de concurrencia optimista.
    if (s.version !== input.version || s.estado !== "ENVIADA") {
      throw new ApiError("CONFLICTO", 409, "Otro usuario ya decidió sobre esta solicitud. Recargue la página.");
    }
    const campos: { campo: string; error: string }[] = [];
    if (input.decision === "APROBAR") {
      if (!(input.asignaturasAprobadas && input.indiceMinimo && input.documentacionCompleta)) {
        campos.push({ campo: "verificacion", error: "Verificación RN-01 incompleta." });
      }
      if (!input.jefeDepartamento.trim() || !input.fechaAprobacionJefe) {
        campos.push({ campo: "jefeDepartamento", error: "Falta el Jefe de Departamento y su fecha." });
      }
      if (!input.documentoComisionId) {
        campos.push({ campo: "documentoComision", error: "Falta la recomendación de la Comisión (PDF)." });
      }
    } else if (!input.observaciones.trim()) {
      campos.push({ campo: "observaciones", error: "Las observaciones o el motivo son obligatorios." });
    }
    if (campos.length) throw new ApiError("VALIDACION", 422, "No se pudo registrar la decisión.", campos);

    const mapa: Record<Decision, Solicitud["estado"]> = { APROBAR: "APROBADA", DEVOLVER: "DEVUELTA", RECHAZAR: "RECHAZADA" };
    s.estado = mapa[input.decision];
    s.version += 1;
    s.ultimaObservacion = input.observaciones || null;
    auditar("Vicedecanato FISC", "EVALUAR_" + input.decision, "solicitud");
    notificar("Solicitud" + { APROBAR: "Aprobada", DEVOLVER: "Devuelta", RECHAZAR: "Rechazada" }[input.decision],
      `Su solicitud ${s.numero} fue ${s.estado}. ${input.observaciones}`);
    persistir();
    return { ...s };
  },

  /* ----- CU-03 ----- */
  async solicitudesAprobadas(): Promise<Solicitud[]> {
    await demora();
    const conPractica = new Set(store().practicas.map((p) => p.numeroSolicitud));
    return store().solicitudes.filter((s) => s.estado === "APROBADA" && !conPractica.has(s.numero ?? ""));
  },
  async formalizarPractica(input: PracticaInput): Promise<Practica> {
    await demora();
    const s = store().solicitudes.find((x) => x.id === input.solicitudId);
    if (!s) throw new ApiError("NO_ENCONTRADO", 404, "Solicitud no encontrada.");
    if (s.estado !== "APROBADA") throw new ApiError("CONFLICTO", 409, "Solo se formalizan solicitudes aprobadas.");
    if (store().practicas.some((p) => p.numeroSolicitud === s.numero)) {
      throw new ApiError("CONFLICTO", 409, "La solicitud ya fue formalizada.");
    }
    const asesor = DOCENTES.find((d) => d.id === input.asesorId);
    const campos: { campo: string; error: string }[] = [];
    if (asesor && input.supervisorCorreo && asesor.correo.toLowerCase() === input.supervisorCorreo.toLowerCase()) {
      campos.push({ campo: "supervisorCorreo", error: "El asesor no puede ser el supervisor (RN-04, E1)." });
    }
    if (!input.supervisorCorreo || !input.fechaInicio || !input.fechaFin) {
      campos.push({ campo: "supervisorCorreo", error: "Complete correo del supervisor y fechas." });
    } else if (!duracionOk(input.fechaInicio, input.fechaFin)) {
      campos.push({ campo: "fechaFin", error: "La duración mínima es de 6 meses (RN-03, E3)." });
    }
    if (campos.length) throw new ApiError("VALIDACION", 422, "No se pudo formalizar la práctica.", campos);

    const token = uid() + uid();
    const practica: Practica = {
      id: uid(), numeroSolicitud: s.numero ?? "", estado: input.fechaInicio > hoy() ? "POR_INICIAR" : "EN_CURSO",
      estudianteNombre: s.estudianteNombre, asesorNombre: asesor?.nombre ?? "—",
      supervisorCorreo: input.supervisorCorreo, supervisorVinculado: false,
      fechaInicio: input.fechaInicio, fechaFin: input.fechaFin, convenio: { id: uid(), nombreOriginal: "convenio_firmado.pdf", tamanoBytes: 310_000 },
      periodos: periodos(input.fechaInicio, input.fechaFin),
      invitacion: { id: uid(), correoDestino: input.supervisorCorreo, venceEn: new Date(Date.now() + 72 * 3600e3).toISOString(), estado: "PENDIENTE" },
    };
    store().practicas.push(practica);
    store().tokens[token] = practica.id;
    auditar("Vicedecanato FISC", "FORMALIZAR_PRACTICA", "practica");
    notificar("PracticaFormalizada", `Invitación para supervisar la práctica de ${s.estudianteNombre} (vence en 72 h).`);
    persistir();
    return { ...practica };
  },
  async listarPracticas(): Promise<Practica[]> {
    await demora();
    return store().practicas.map((p) => ({ ...p }));
  },
  async reenviarInvitacion(practicaId: string): Promise<Invitacion> {
    await demora();
    const p = store().practicas.find((x) => x.id === practicaId);
    if (!p) throw new ApiError("NO_ENCONTRADO", 404, "Práctica no encontrada.");
    if (p.invitacion && p.invitacion.estado === "PENDIENTE") p.invitacion.estado = "REVOCADA";
    const token = uid() + uid();
    p.invitacion = { id: uid(), correoDestino: p.supervisorCorreo, venceEn: new Date(Date.now() + 72 * 3600e3).toISOString(), estado: "PENDIENTE" };
    store().tokens[token] = p.id;
    auditar("Vicedecanato FISC", "REENVIAR_INVITACION", "practica");
    notificar("InvitacionReenviada", "Nueva invitación (vence en 72 h).");
    persistir();
    return { ...p.invitacion };
  },

  /* ----- Supervisor ----- */
  async invitacionesSupervisor(): Promise<Invitacion[]> {
    await demora();
    const u = usuarioGuardado();
    const correo = u?.correo ?? "";
    // Vence las pendientes expiradas.
    store().practicas.forEach((p) => {
      if (p.invitacion && p.invitacion.estado === "PENDIENTE" && Date.now() > Date.parse(p.invitacion.venceEn)) {
        p.invitacion.estado = "VENCIDA";
      }
    });
    persistir();
    return store().practicas
      .filter((p) => p.invitacion && p.invitacion.correoDestino.toLowerCase() === correo.toLowerCase())
      .map((p) => p.invitacion!);
  },
  async aceptarInvitacion(idInvitacion: string): Promise<void> {
    await demora();
    const p = store().practicas.find((x) => x.invitacion?.id === idInvitacion);
    if (!p || !p.invitacion) throw new ApiError("NO_ENCONTRADO", 404, "Invitación no encontrada.");
    const inv = p.invitacion;
    if (inv.estado !== "PENDIENTE") throw new ApiError("VENCIDO", 410, "La invitación venció, se revocó o ya se usó.");
    if (Date.now() > Date.parse(inv.venceEn)) { inv.estado = "VENCIDA"; persistir(); throw new ApiError("VENCIDO", 410, "La invitación venció."); }
    inv.estado = "USADA";
    p.supervisorVinculado = true;
    auditar(inv.correoDestino, "ACEPTAR_INVITACION", "invitacion");
    persistir();
  },

  /* ----- Soporte ----- */
  async listarNotificaciones(): Promise<Notificacion[]> {
    return store().notificaciones.map((n) => ({ ...n }));
  },
  async listarAuditoria(): Promise<Auditoria[]> {
    return store().auditoria.map((a) => ({ ...a }));
  },
};

function aplicar(input: SolicitudInput): Partial<Solicitud> {
  return {
    empresaNombre: input.empresaNombre,
    empresaDireccion: input.empresaDireccion,
    supervisorNombre: input.supervisorNombre,
    supervisorCargo: input.supervisorCargo,
    supervisorCorreo: input.supervisorCorreo,
    supervisorTelefono: input.supervisorTelefono,
    objetivo: input.objetivo,
    actividades: input.actividades,
    fechaInicio: input.fechaInicio || null,
    fechaFin: input.fechaFin || null,
    asesorSugeridoId: input.asesorSugeridoId,
    consentimientoDatos: input.consentimientoDatos,
  };
}

function validarPdf(archivo: File): void {
  if (archivo.size > MAX_BYTES) throw new ApiError("ARCHIVO_GRANDE", 413, `"${archivo.name}" supera 10 MB.`);
  const esPdf = archivo.type === "application/pdf" || /\.pdf$/i.test(archivo.name);
  if (!esPdf) throw new ApiError("TIPO_NO_PERMITIDO", 415, `"${archivo.name}" no es un PDF.`);
}
