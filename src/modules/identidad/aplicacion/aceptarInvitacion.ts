import { prisma } from "@/src/shared/db/prisma";
import { sha256Hex, hashContrasena } from "@/src/shared/crypto/hash";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import { relojSistema } from "@/src/shared/reloj";
import { Rol, EstadoInvitacion } from "@/src/shared/dominio/enums";
import { ErrorVencido, ErrorValidacion } from "@/src/shared/errores/errores";

export interface ResultadoAceptacion {
  supervisorId: string;
  cuentaNueva: boolean;
}

// POST /api/invitaciones/{token}/aceptacion (CU-03): el supervisor acepta su
// invitacion de un solo uso y crea o vincula su cuenta. La cookie la escribe la ruta.
export async function aceptarInvitacion(
  token: string,
  nombre: string,
  contrasena: string,
): Promise<ResultadoAceptacion> {
  if (!nombre?.trim()) throw new ErrorValidacion("El nombre es obligatorio.");
  if (!contrasena || contrasena.length < 8) {
    throw new ErrorValidacion("La contrasena debe tener al menos 8 caracteres.");
  }

  const hashToken = sha256Hex(token);
  const ahora = relojSistema.ahora();

  return prisma.$transaction(async (tx) => {
    const inv = await tx.invitacion.findUnique({ where: { hashToken } });
    // Token inexistente: no se revela si existio (se trata como vencido).
    if (!inv) throw new ErrorVencido("La invitacion no es valida.");

    if (inv.estado === EstadoInvitacion.USADA) {
      throw new ErrorVencido("La invitacion ya fue utilizada.");
    }
    // Solo continúa si sigue PENDIENTE y dentro del TTL.
    const vigente = inv.estado === EstadoInvitacion.PENDIENTE && inv.venceEn > ahora;
    if (!vigente) {
      if (inv.estado === EstadoInvitacion.PENDIENTE) {
        await tx.invitacion.update({
          where: { id: inv.id },
          data: { estado: EstadoInvitacion.VENCIDA },
        });
      }
      throw new ErrorVencido("La invitacion vencio.");
    }

    const practica = await tx.practica.findUnique({ where: { id: inv.practicaId } });
    if (!practica) throw new ErrorVencido("La practica asociada ya no existe.");

    const existente = await tx.usuario.findUnique({ where: { correo: inv.correoDestino } });
    let supervisorId: string;
    let cuentaNueva = false;

    if (existente) {
      if (existente.rol !== Rol.SUPERVISOR) {
        throw new ErrorValidacion(
          "El correo ya pertenece a una cuenta que no es de supervisor.",
          [{ campo: "correo", error: "Use un correo de supervisor o inicie sesion con esa cuenta." }],
        );
      }
      if (!existente.activo) {
        throw new ErrorValidacion("La cuenta de supervisor esta inactiva.");
      }
      supervisorId = existente.id;
    } else {
      const hash = await hashContrasena(contrasena);
      const supervisor = await tx.usuario.create({
        data: {
          correo: inv.correoDestino,
          nombre,
          rol: Rol.SUPERVISOR,
          passwordHash: hash,
        },
      });
      supervisorId = supervisor.id;
      cuentaNueva = true;
    }

    // Vincula el supervisor a la practica (el CHECK ck_practica_roles valida RN-04).
    await tx.practica.update({
      where: { id: practica.id },
      data: { supervisorId },
    });

    await tx.invitacion.update({
      where: { id: inv.id },
      data: { estado: EstadoInvitacion.USADA, usadaEn: ahora },
    });

    await registrarAuditoria(tx, {
      usuarioId: supervisorId,
      accion: "INVITACION_ACEPTADA",
      entidad: "practica",
      entidadId: practica.id,
      datos: { invitacionId: inv.id, cuentaNueva },
    });

    return { supervisorId, cuentaNueva };
  });
}
