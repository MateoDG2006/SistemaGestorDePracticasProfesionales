import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Datos de ejemplo para CU-01 a CU-03. Contrasena de desarrollo para todos:
//   Practica123
// El supervisor NO se siembra: se crea al aceptar su invitacion (CU-03).
async function main() {
  const password = await bcrypt.hash("Practica123", 12);

  const estudiante = await prisma.usuario.upsert({
    where: { correo: "estudiante@utp.ac.pa" },
    update: { passwordHash: password, nombre: "Ana Pérez", activo: true },
    create: { correo: "estudiante@utp.ac.pa", nombre: "Ana Pérez", rol: "ESTUDIANTE", passwordHash: password },
  });
  await prisma.perfilEstudiante.upsert({
    where: { usuarioId: estudiante.id },
    update: { carrera: "Lic. en Ingenieria de Sistemas y Computacion" },
    create: {
      usuarioId: estudiante.id,
      cedula: "8-888-8888",
      carrera: "Lic. en Ingenieria de Sistemas y Computacion",
    },
  });

  await prisma.usuario.upsert({
    where: { correo: "vicedecanato@utp.ac.pa" },
    update: { passwordHash: password, nombre: "Vicedecanato FISC", activo: true },
    create: { correo: "vicedecanato@utp.ac.pa", nombre: "Vicedecanato FISC", rol: "VICEDECANATO", passwordHash: password },
  });

  await prisma.usuario.upsert({
    where: { correo: "asesor1@utp.ac.pa" },
    update: { passwordHash: password, nombre: "Dr. Carlos Mora", activo: true },
    create: { correo: "asesor1@utp.ac.pa", nombre: "Dr. Carlos Mora", rol: "ASESOR", passwordHash: password },
  });
  await prisma.usuario.upsert({
    where: { correo: "asesor2@utp.ac.pa" },
    update: { passwordHash: password, nombre: "Dra. Luisa Rivas", activo: true },
    create: { correo: "asesor2@utp.ac.pa", nombre: "Dra. Luisa Rivas", rol: "ASESOR", passwordHash: password },
  });

  const empresaExistente = await prisma.empresa.findFirst({
    where: { ruc: "155-1-2024" },
  });
  if (empresaExistente) {
    await prisma.empresa.update({
      where: { id: empresaExistente.id },
      data: {
        nombre: "Tecnologías Istmo S.A.",
        direccion: "Ciudad de Panamá",
      },
    });
  } else {
    await prisma.empresa.create({
      data: {
        nombre: "Tecnologías Istmo S.A.",
        ruc: "155-1-2024",
        direccion: "Ciudad de Panamá",
        telefono: "+507 300-0000",
        correo: "rrhh@istmo.example",
      },
    });
  }

  console.log("Seed completado. Contraseña de todos los usuarios: Practica123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
