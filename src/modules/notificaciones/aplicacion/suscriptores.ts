import { bus } from "@/src/shared/eventos/bus";
import type { Tx } from "@/src/shared/db/prisma";
import { TipoEvento } from "@/src/shared/eventos/tipos";
import type {
  SolicitudEnviada,
  SolicitudDevuelta,
  SolicitudRechazada,
  SolicitudAprobada,
  PracticaFormalizada,
  PracticaIniciada,
  InvitacionVencida,
} from "@/src/shared/eventos/tipos";
import { Rol } from "@/src/shared/dominio/enums";
import { notificarEnPlataforma, encolarCorreo } from "../infra/encolar";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// Registra los manejadores de Notificaciones en el bus. Idempotente mediante
// la bandera de arranque de src/arranque.ts.
export function registrarSuscriptoresNotificaciones(): void {
  // --- CU-01: solicitud enviada o corregida -> Vicedecanato ---
  bus.suscribir(TipoEvento.SolicitudEnviada, async (e, tx) => {
    const ev = e as SolicitudEnviada;
    const mensaje = ev.esCorreccion
      ? `La solicitud ${ev.numero} fue corregida y reenviada.`
      : `Nueva solicitud de practica ${ev.numero} por evaluar.`;
    const vicedecanos = await tx.usuario.findMany({
      where: { rol: Rol.VICEDECANATO, activo: true },
    });
    for (const v of vicedecanos) {
      await notificarEnPlataforma(tx, v.id, ev.tipo, mensaje);
      await encolarCorreo(tx, v.correo, ev.tipo, { mensaje, solicitudId: ev.solicitudId });
    }
  });

  // --- CU-02: devuelta -> estudiante ---
  bus.suscribir(TipoEvento.SolicitudDevuelta, async (e, tx) => {
    const ev = e as SolicitudDevuelta;
    const mensaje = `Su solicitud fue devuelta con observaciones: ${ev.observaciones}`;
    await avisarUsuario(tx, ev.estudianteId, ev.tipo, mensaje, { solicitudId: ev.solicitudId });
  });

  // --- CU-02: rechazada -> estudiante ---
  bus.suscribir(TipoEvento.SolicitudRechazada, async (e, tx) => {
    const ev = e as SolicitudRechazada;
    const mensaje = `Su solicitud fue rechazada. Motivo: ${ev.motivo}`;
    await avisarUsuario(tx, ev.estudianteId, ev.tipo, mensaje, { solicitudId: ev.solicitudId });
  });

  // --- CU-02: aprobada -> estudiante ---
  bus.suscribir(TipoEvento.SolicitudAprobada, async (e, tx) => {
    const ev = e as SolicitudAprobada;
    const mensaje = "Su solicitud de practica fue aprobada.";
    await avisarUsuario(tx, ev.estudianteId, ev.tipo, mensaje, { solicitudId: ev.solicitudId });
  });

  // --- CU-03: practica formalizada -> supervisor (invitacion), asesor y estudiante ---
  bus.suscribir(TipoEvento.PracticaFormalizada, async (e, tx) => {
    const ev = e as PracticaFormalizada;

    if (ev.invitacionToken) {
      const enlace = `${APP_URL}/invitaciones/${ev.invitacionToken}`;
      await encolarCorreo(tx, ev.supervisorCorreo, ev.tipo, {
        mensaje: `Fue designado supervisor de una practica. Acepte su acceso aqui: ${enlace}`,
        practicaId: ev.practicaId,
        enlace,
      });
    } else if (ev.supervisorVinculadoId) {
      await avisarUsuario(tx, ev.supervisorVinculadoId, ev.tipo,
        "Se le vinculo como supervisor de una nueva practica.", { practicaId: ev.practicaId });
    }

    await avisarUsuario(tx, ev.asesorId, ev.tipo,
      "Fue asignado como asesor de una practica formalizada.", { practicaId: ev.practicaId });
    await avisarUsuario(tx, ev.estudianteId, ev.tipo,
      "Su practica fue formalizada.", { practicaId: ev.practicaId });
  });

  // --- CU-03 A2: practica iniciada -> estudiante y asesor ---
  bus.suscribir(TipoEvento.PracticaIniciada, async (e, tx) => {
    const ev = e as PracticaIniciada;
    await avisarUsuario(tx, ev.estudianteId, ev.tipo, "Su practica paso a EN CURSO.", {
      practicaId: ev.practicaId,
    });
    await avisarUsuario(tx, ev.asesorId, ev.tipo, "Una practica que asesora paso a EN CURSO.", {
      practicaId: ev.practicaId,
    });
  });

  // --- CU-03 E4: invitacion vencida -> Vicedecanato ---
  bus.suscribir(TipoEvento.InvitacionVencida, async (e, tx) => {
    const ev = e as InvitacionVencida;
    const mensaje = "Una invitacion de supervisor vencio sin usarse. Puede reenviarla.";
    const vicedecanos = await tx.usuario.findMany({
      where: { rol: Rol.VICEDECANATO, activo: true },
    });
    for (const v of vicedecanos) {
      await notificarEnPlataforma(tx, v.id, ev.tipo, mensaje);
      await encolarCorreo(tx, v.correo, ev.tipo, { mensaje, practicaId: ev.practicaId });
    }
  });
}

// Notifica en plataforma y por correo a un usuario con cuenta.
async function avisarUsuario(
  tx: Tx,
  usuarioId: string,
  tipoEvento: string,
  mensaje: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await notificarEnPlataforma(tx, usuarioId, tipoEvento, mensaje);
  const u = await tx.usuario.findUnique({ where: { id: usuarioId } });
  if (u?.correo) {
    await encolarCorreo(tx, u.correo, tipoEvento, { ...payload, mensaje });
  }
}
