import { prisma } from "@/src/shared/db/prisma";
import { fechaAPrisma } from "@/src/shared/db/fecha";
import { TipoDocumento } from "@/src/shared/dominio/enums";
import { validarPdf } from "@/src/shared/pdf/validadorPdf";
import { guardarArchivo } from "@/src/shared/pdf/almacenArchivos";
import { registrarAuditoria } from "@/src/modules/auditoria/auditoriaApi";
import { bus } from "@/src/shared/eventos/bus";
import { TipoEvento, type PracticaFormalizada } from "@/src/shared/eventos/tipos";
import { obtenerAprobada } from "@/src/modules/solicitudes/infra/solicitudesApi";
import { obtenerDocente, invitarSupervisor } from "@/src/modules/identidad/infra/identidadApi";
import { generarPeriodos, estadoInicialPractica } from "@/src/shared/dominio/reglas";
import { validarFormalizacion } from "../dominio/practica";
import {
  ErrorNoEncontrado,
  ErrorValidacion,
  ErrorConflicto,
} from "@/src/shared/errores/errores";

export interface ConvenioEntrada {
  nombreOriginal: string;
  buffer: Buffer;
  mime?: string;
}

export interface DatosFormalizacion {
  solicitudId: string;
  asesorId?: string | null; // confirma el sugerido o asigna otro
  fechaInicio?: Temporal.PlainDate | null;
  fechaFin?: Temporal.PlainDate | null;
  convenio: ConvenioEntrada;
  supervisorCorreo?: string | null;
}

function esUnicidad(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

// CU-03: formaliza una solicitud aprobada (asesor + convenio + 6 periodos + acceso del supervisor).
export async function formalizarPractica(vicedecanoId: string, datos: DatosFormalizacion) {
  const sol = await obtenerAprobada(datos.solicitudId);
  if (!sol) throw new ErrorNoEncontrado("No existe una solicitud aprobada con ese id.");

  // Asesor: confirma el sugerido o asigna otro docente de la FISC.
  const asesorId = datos.asesorId ?? sol.asesorSugeridoId;
  if (!asesorId) throw new ErrorValidacion("Debe asignar un profesor asesor.", [
    { campo: "asesorId", error: "El asesor es obligatorio." },
  ]);
  const asesor = await obtenerDocente(asesorId);
  if (!asesor) throw new ErrorValidacion("El asesor no es un docente valido de la FISC.", [
    { campo: "asesorId", error: "Asesor invalido." },
  ]);

  const fechaInicio = datos.fechaInicio ?? sol.fechaInicio;
  const fechaFin = datos.fechaFin ?? sol.fechaFin;
  const supervisorCorreo = datos.supervisorCorreo?.trim() || sol.supervisorCorreo;

  validarFormalizacion({
    asesorCorreo: asesor.correo,
    supervisorCorreo,
    fechaInicio,
    fechaFin,
    tieneConvenio: !!datos.convenio?.buffer?.byteLength,
  });

  validarPdf(datos.convenio.buffer, datos.convenio.mime);

  const hoy = Temporal.Now.plainDateISO("UTC").toString();
  const estado = estadoInicialPractica(fechaInicio.toString(), hoy);
  const periodos = generarPeriodos(fechaInicio.toString(), fechaFin.toString());

  try {
    return await prisma.$transaction(async (tx) => {
      const practica = await tx.practica.create({
        data: {
          solicitudId: sol.id,
          estudianteId: sol.estudianteId,
          asesorId,
          supervisorCorreo,
          fechaInicio: fechaAPrisma(fechaInicio),
          fechaFin: fechaAPrisma(fechaFin),
          estado,
          formalizadaPor: vicedecanoId,
        },
      });

      // Convenio guardado en disco; en la base solo ruta, hash y tamano (D9).
      const guardado = await guardarArchivo(datos.convenio.buffer, `practicas/${practica.id}`);
      await tx.documentoPractica.create({
        data: {
          practicaId: practica.id,
          tipo: TipoDocumento.CONVENIO,
          nombreOriginal: datos.convenio.nombreOriginal,
          ruta: guardado.ruta,
          hashSha256: guardado.hashSha256,
          tamanoBytes: guardado.tamanoBytes,
        },
      });

      // Seis periodos mensuales con sus vencimientos (RN-03, RN-05).
      await tx.periodoMensual.createMany({
        data: periodos.map((p) => ({
          practicaId: practica.id,
          numero: p.numero,
          fechaInicio: fechaAPrisma(Temporal.PlainDate.from(p.fechaInicio)),
          fechaCierre: fechaAPrisma(Temporal.PlainDate.from(p.fechaCierre)),
          venceInforme: fechaAPrisma(Temporal.PlainDate.from(p.venceInforme)),
        })),
      });

      // Supervisor: invitacion de un solo uso o vinculacion de cuenta existente (CU-03 A1).
      const inv = await invitarSupervisor(tx, practica.id, supervisorCorreo);
      let invitacionToken: string | undefined;
      let supervisorVinculadoId: string | undefined;
      if (inv.tipo === "VINCULADO") {
        supervisorVinculadoId = inv.supervisorId;
        await tx.practica.update({
          where: { id: practica.id },
          data: { supervisorId: inv.supervisorId },
        });
      } else {
        invitacionToken = inv.token;
      }

      await registrarAuditoria(tx, {
        usuarioId: vicedecanoId,
        accion: "PRACTICA_FORMALIZADA",
        entidad: "practica",
        entidadId: practica.id,
        datos: { solicitudId: sol.id, estado, asesorId },
      });

      const evento: PracticaFormalizada = {
        tipo: TipoEvento.PracticaFormalizada,
        practicaId: practica.id,
        estudianteId: sol.estudianteId,
        asesorId,
        supervisorCorreo,
        invitacionToken,
        supervisorVinculadoId,
      };
      await bus.publicar(tx, evento);

      return { id: practica.id, estado, periodos: periodos.length };
    });
  } catch (e) {
    if (esUnicidad(e)) throw new ErrorConflicto("La solicitud ya fue formalizada.");
    throw e;
  }
}
