# SGPP FISC — Backend (CU-01, CU-02, CU-03)

Sistema de Gestion de Practicas Profesionales de la FISC (UTP). Backend del MVP
sobre **Next.js 16 (App Router) + Prisma + PostgreSQL**, siguiendo el diseno de
la Fase 2: monolito modular en capas (presentacion -> aplicacion -> dominio <- infraestructura).

Casos de uso implementados:
- **CU-01** Solicitar practica profesional (estudiante).
- **CU-02** Evaluar solicitud de practica (Vicedecanato, con concurrencia optimista).
- **CU-03** Formalizar practica (Vicedecanato: asesor, convenio, 6 periodos, invitacion del supervisor).

## Requisitos
- Node.js 20+ y npm
- Docker (para PostgreSQL local)

## Puesta en marcha
```bash
# 1. Variables de entorno
cp .env.example .env        # ya viene con la URL del Postgres de docker-compose

# 2. Base de datos local
npm run db:up               # levanta Postgres 16 en localhost:5432

# 3. Dependencias
npm install

# 4. Prisma: generar cliente y aplicar el esquema
npm run prisma:generate
npm run prisma:migrate      # aplica prisma/migrations/0001_init (prisma migrate deploy)

# 5. Datos de ejemplo
npm run seed                # usuarios de prueba (contrasena: Practica123)

# 6. Levantar la app y el worker (en terminales separadas)
npm run dev                 # http://localhost:3000
npm run worker              # despacha correos (outbox) y tareas programadas
```

> Nota: `prisma migrate deploy` aplica la migracion escrita a mano, que incluye
> las restricciones CHECK e indices unicos parciales (RN-01..RN-05, RNF-09) que
> el schema de Prisma no expresa. Si luego usas `prisma migrate dev`, Prisma
> puede reportar "drift" por esas restricciones: es esperado.

## Usuarios de prueba (seed)
| Rol          | Correo                   | Contrasena   |
|--------------|--------------------------|--------------|
| Estudiante   | estudiante@utp.ac.pa     | Practica123  |
| Vicedecanato | vicedecanato@utp.ac.pa   | Practica123  |
| Asesor       | asesor1@utp.ac.pa        | Practica123  |
| Asesor       | asesor2@utp.ac.pa        | Practica123  |

El **supervisor** no se siembra: su cuenta se crea al aceptar la invitacion (CU-03).

## API REST (resumen)
Autenticacion por cookie de sesion (RNF-02). Formato de error comun:
`{ "codigo", "mensaje", "campos": [{ "campo", "error" }] }`.

| Metodo | Ruta                                           | CU     | Rol          |
|--------|------------------------------------------------|--------|--------------|
| POST/DELETE/GET | `/api/sesiones`                       | —      | Todos        |
| POST   | `/api/solicitudes`                             | CU-01  | Estudiante   |
| PUT    | `/api/solicitudes/{id}`                        | CU-01  | Estudiante   |
| POST   | `/api/solicitudes/{id}/documentos`             | CU-01/02 | Estudiante/Vicedecanato |
| POST   | `/api/solicitudes/{id}/envio`                  | CU-01  | Estudiante   |
| GET    | `/api/solicitudes/mias`                        | CU-01  | Estudiante   |
| GET    | `/api/docentes`                                | CU-01/03 | Estudiante/Vicedecanato |
| GET    | `/api/solicitudes?estado=ENVIADA&pagina=n`     | CU-02  | Vicedecanato |
| GET    | `/api/solicitudes/{id}`                         | CU-02  | Vicedecanato/propietario |
| POST   | `/api/solicitudes/{id}/evaluaciones`           | CU-02  | Vicedecanato |
| GET    | `/api/documentos/{id}/contenido`               | CU-02/03 | Participantes |
| GET    | `/api/solicitudes?estado=APROBADA&sinFormalizar=true` | CU-03 | Vicedecanato |
| POST   | `/api/practicas`                               | CU-03  | Vicedecanato |
| POST   | `/api/practicas/{id}/invitaciones/reenvio`     | CU-03  | Vicedecanato |
| POST   | `/api/invitaciones/{token}/aceptacion`         | CU-03  | Supervisor (token) |

Las cargas de archivos usan `multipart/form-data` (campo `archivo` o `convenio`).

## Estructura
```
prisma/                 schema.prisma, migrations/0001_init, seed.ts
src/
  shared/               db (Prisma), eventos (bus + outbox), errores, auth, pdf, crypto, http, fechas, reloj
  modules/
    identidad/          sesion, invitaciones, invitarSupervisor
    solicitudes/        CU-01 y CU-02 (dominio: maquina de estados; app: handlers; infra: SolicitudesApi)
    practicas/          CU-03 (CalculadoraPeriodos, FormalizarPractica)
    notificaciones/     suscriptores de eventos -> notificacion + mensaje_outbox
    auditoria/          registro transaccional (RNF-04)
  worker/               despachadorOutbox, activarPracticas, vencerInvitaciones
app/api/                route handlers (capa de presentacion)
almacen_archivos/       PDFs fuera de la base (D9) — no versionado
```

## Mapeo con el diseno
- Maquinas de estado en el dominio (D12), control de concurrencia optimista con `version` (D11, CU-02 E3).
- Eventos internos en la misma transaccion que el cambio; el correo se envia desde el outbox con reintentos (RNF-05).
- Invitaciones de un solo uso con hash y vencimiento de 72 h (RNF-02); PDF solo <=10 MB validado por firma (RNF-09).
- Autorizacion por solicitud y practica (RNF-01); auditoria en la misma transaccion (RNF-04).
