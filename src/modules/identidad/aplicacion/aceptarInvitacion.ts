import { prisma } from "@/src/shared/db/prisma";
import { sha256Hex, hashContrasena } from "@/src/shared/crypto/hash";
import { crearSesion } from "@/src/shared/auth/sesion";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import { relojSistema } from "@/src/shared/reloj";
import { Rol, EstadoInvitacion } from "@/src/shared/dominio/enums";
import { ErrorVencido, ErrorValidacion } from "@/src/shared/errores/errores";

// POST /api/invitaciones/{token}/aceptacion (CU-03): el supervisor acepta su
// invitacion de un solo uso, crea o vincula su cuenta y obtiene acceso a la practica.
export async function aceptarInvitacion(token: string, nombre: string, contrasena: string) {
  if (!nombre?.trim()) throw new ErrorValidacion("El nombre es obligatorio.");
  if (!contrasena || contrasena.length < 8) {
    throw new ErrorValidacion("La contrasena debe tener al menos 8 caracteres.");
  }

  const hashToken = sha256Hex(token);
  const ahora = relojSistema.ahora();

  const supervisorId = await prisma.$transaction(async (tx) => {
    const inv = await tx.invitacion.findUnique({ where: { hashToken } });
    // Token inexistente: no se revela si existio (se trata como vencido).
    if (!inv) throw new ErrorVencido("La invitacion no es valida.");

    if (inv.estado === EstadoInvitacion.USADA) {
      throw new ErrorVencido("La invitacion ya fue utilizada.");
    }
    if (inv.estado !== EstadoInvitacion.PENDIENTE || inv.venceEn <= ahora) {
      if (inv.venceEn <= ahora && inv.estado === EstadoInvitacion.PENDIENTE) {
        await tx.invitacion.update({
          where: { id: inv.id },
          data: { estado: EstadoInvitacion.VENCIDA },
        });
      }
      throw new ErrorVencido("La invitacion vencio.");
    }

    const practica = await tx.practica.findUnique({ where: { id: inv.practicaId } });
    if (!practica) throw new ErrorVencido("La practica asociada ya no existe.");

    const hash = await hashContrasena(contrasena);

    // Crea o actualiza la cuenta del supervisor (externo a la UTP).
    const supervisor = await tx.usuario.upsert({
      where: { correo: inv.correoDestino },
      update: { passwordHash: hash, nombre, activo: true },
      create: {
        correo: inv.correoDestino,
        nombre,
        rol: Rol.SUPERVISOR,
        passwordHash: hash,
      },
    });

    // Vincula el supervisor a la practica (el CHECK ck_practica_roles valida RN-04).
    await tx.practica.update({
      where: { id: practica.id },
      data: { supervisorId: supervisor.id },
    });

    await tx.invitacion.update({
      where: { id: inv.id },
      data: { estado: EstadoInvitacion.USADA, usadaEn: ahora },
    });

    await registrarAuditoria(tx, {
      usuarioId: supervisor.id,
      accion: "INVITACION_ACEPTADA",
      entidad: "practica",
      entidadId: practica.id,
      datos: { invitacionId: inv.id },
    });

    return supervisor.id;
  });

  await crearSesion(supervisorId);
  return { supervisorId };
}
