# SGPP FISC — Sistema de Gestión de Prácticas Profesionales

MVP web para gestionar las prácticas profesionales de la FISC (UTP). Construido con
**Next.js 16 (App Router) + Prisma 6 + PostgreSQL 16**, como monolito modular en capas  
(presentación → aplicación → dominio ← infraestructura).

Casos de uso implementados:

- **CU-01** Solicitar práctica profesional (estudiante).
- **CU-02** Evaluar solicitud de práctica (Vicedecanato, con concurrencia optimista).
- **CU-03** Formalizar práctica (Vicedecanato: asesor, convenio, 6 períodos, invitación del supervisor).

## Índice

| Entregable                     | Sección                                                        |
|--------------------------------|----------------------------------------------------------------|
| Versión ejecutable             | [1. Versión ejecutable](#1-versión-ejecutable)                 |
| Código / repositorio           | [2. Código y repositorio](#2-código-y-repositorio)             |
| Configuración y datos          | [3. Configuración y datos necesarios](#3-configuración-y-datos-necesarios) |
| Guía de ejecución              | [4. Guía de ejecución](#4-guía-de-ejecución)                   |
| Evidencia funcional            | [5. Evidencia funcional](#5-evidencia-funcional)               |
| Matriz actualizada             | [6. Matriz de trazabilidad](#6-matriz-de-trazabilidad)         |

---

## 1. Versión ejecutable

| Dato                  | Valor                                              |
|-----------------------|----------------------------------------------------|
| Versión               | 0.1.0 (`package.json`)                             |
| Commit verificado     | `aba6674`, rama `master`                           |
| Forma de ejecución    | Local: `npm run dev` (web) + `npm run worker` (worker) |
| URL                   | http://localhost:3000                              |

La versión entregada se compone de tres procesos:

| Proceso       | Comando          | Función                                                        |
|---------------|------------------|----------------------------------------------------------------|
| Base de datos | `npm run db:up`  | PostgreSQL 16 en Docker, puerto 5432                           |
| Web           | `npm run dev`    | Interfaz y API REST                                            |
| Worker        | `npm run worker` | Correos (outbox, cada 30 s), vencimiento de invitaciones y activación de prácticas (cada hora) |

> **Compilación de producción:** `npm run build` falla actualmente al prerenderizar
> `/vicedecanato/evaluar/[id]` (P-01 en [pendientes](#63-pendientes-conocidos)). La versión
> ejecutable de este entregable es la de `npm run dev`.

## 2. Código y repositorio

Repositorio: https://github.com/MateoDG2006/SistemaGestorDePracticasProfesionales

```
app/
  (app)/                pantallas autenticadas: estudiante, vicedecanato, asesor, supervisor, auditoria
  ingresar/             inicio de sesión
  api/                  route handlers REST (capa de presentación)
  _components/, _lib/   componentes, cliente API tipado y modo demostración (mock)
components/ui/          componentes base de interfaz
src/
  shared/               db (Prisma), dominio (enums y reglas), eventos, errores, auth, pdf, crypto, http, reloj
  modules/
    identidad/          sesión, docentes, invitación y alta del supervisor
    solicitudes/        CU-01 y CU-02
    practicas/          CU-03
    notificaciones/     suscriptores de eventos -> notificacion + mensaje_outbox
    auditoria/          registro transaccional (RNF-04)
  worker/               despachadorOutbox, activarPracticas, vencerInvitaciones, mailer
prisma/                 schema.prisma, migrations/, seed.ts
proxy.ts                verificación optimista de sesión antes de cada pantalla
docker-compose.yml      PostgreSQL local
almacen_archivos/       PDF fuera de la base (D9); su contenido no se versiona
```

Decisiones de diseño reflejadas en el código:

- Estados y reglas centralizados en `src/shared/dominio/reglas.ts` (D12); concurrencia optimista con `version` (D11, CU-02 E3).
- Eventos internos en la misma transacción que el cambio; el correo sale desde el outbox con hasta 3 intentos (RNF-05).
- Invitaciones de un solo uso, guardadas como hash, con vencimiento de 72 h (RNF-02).
- Solo PDF de hasta 10 MB, validado por firma y almacenado fuera de la base (RNF-09, D9).

### API REST

Autenticación por cookie de sesión (RNF-02). Formato común de error:
`{ "codigo", "mensaje", "campos": [{ "campo", "error" }] }`.

| Método | Ruta                                           | CU       | Rol                      |
|--------|------------------------------------------------|----------|--------------------------|
| POST/DELETE/GET | `/api/sesiones`                       | —        | Todos                    |
| POST   | `/api/solicitudes`                             | CU-01    | Estudiante               |
| PUT    | `/api/solicitudes/{id}`                        | CU-01    | Estudiante               |
| POST   | `/api/solicitudes/{id}/documentos`             | CU-01/02 | Estudiante/Vicedecanato  |
| POST   | `/api/solicitudes/{id}/envio`                  | CU-01    | Estudiante               |
| GET    | `/api/solicitudes/mias`                        | CU-01    | Estudiante               |
| GET    | `/api/docentes`                                | CU-01/03 | Estudiante/Vicedecanato  |
| GET    | `/api/solicitudes/sugeridas-mias`              | CU-01    | Asesor                   |
| GET    | `/api/solicitudes?estado=ENVIADA&pagina=n`     | CU-02    | Vicedecanato             |
| GET    | `/api/solicitudes/{id}`                        | CU-02    | Vicedecanato/propietario |
| POST   | `/api/solicitudes/{id}/evaluaciones`           | CU-02    | Vicedecanato             |
| GET    | `/api/documentos/{id}/contenido`               | CU-02/03 | Participantes            |
| GET    | `/api/solicitudes?estado=APROBADA&sinFormalizar=true` | CU-03 | Vicedecanato          |
| GET    | `/api/practicas`                               | CU-03    | Vicedecanato/Asesor      |
| POST   | `/api/practicas`                               | CU-03    | Vicedecanato             |
| POST   | `/api/practicas/{id}/invitaciones/reenvio`     | CU-03    | Vicedecanato             |
| POST   | `/api/invitaciones/{token}/aceptacion`         | CU-03    | Supervisor (token)       |

Las cargas de archivos usan `multipart/form-data` (campo `archivo` o `convenio`).

## 3. Configuración y datos necesarios

### 3.1 Requisitos

- **Node.js 26 o superior** y npm. El código usa `Temporal` nativo, que no existe en Node 22 ni 24.
- **Docker** con Docker Compose (para PostgreSQL 16).
- Git. Puertos 3000 y 5432 libres.

### 3.2 Variables de entorno

Los archivos `.env*` no se versionan. Cree un archivo `.env` en la raíz con este contenido:

```dotenv
# Base de datos (coincide con docker-compose.yml)
DATABASE_URL="postgresql://sgpp:sgpp_dev@localhost:5432/sgpp?schema=public"

# Sesión: firma de la cookie y minutos de inactividad (cambie el secreto)
SESSION_SECRET="cambia-esto-por-un-secreto-largo-y-aleatorio"
SESSION_TTL_MINUTES="30"

# Almacén de archivos PDF (RNF-09 / D9)
ALMACEN_ARCHIVOS_DIR="./almacen_archivos"

# Invitaciones de supervisor (RNF-02)
INVITACION_TTL_HORAS="72"
APP_URL="http://localhost:3000"

# Correo. Con SMTP_HOST vacío, el worker imprime los correos en consola
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
CORREO_REMITENTE="no-reply@sgpp.fisc.utp.ac.pa"

# real = usa la API y la base de datos; mock = datos de demostración en el navegador
NEXT_PUBLIC_API_MODE="real"
```

Si se omite `NEXT_PUBLIC_API_MODE`, la interfaz arranca en `mock` y **no** usa la base de datos.

### 3.3 Datos iniciales

`npm run seed` carga estos usuarios y la empresa «Tecnologías Istmo S.A.». Puede repetirse sin duplicar datos.

| Rol          | Correo                   | Contraseña   |
|--------------|--------------------------|--------------|
| Estudiante   | estudiante@utp.ac.pa     | Practica123  |
| Vicedecanato | vicedecanato@utp.ac.pa   | Practica123  |
| Asesor       | asesor1@utp.ac.pa        | Practica123  |
| Asesor       | asesor2@utp.ac.pa        | Practica123  |

Son credenciales solo de desarrollo. El **supervisor** no se siembra: su cuenta se crea al
aceptar la invitación (CU-03). Para la demostración se necesitan además tres PDF cualesquiera
de hasta 10 MB: nota de aceptación, recomendación de la Comisión y convenio firmado.

## 4. Guía de ejecución

### 4.1 Puesta en marcha

```bash
# 1. Obtener el código
git clone https://github.com/MateoDG2006/SistemaGestorDePracticasProfesionales.git
cd SistemaGestorDePracticasProfesionales

# 2. Crear el archivo .env (sección 3.2)

# 3. Instalar dependencias
npm ci

# 4. Levantar PostgreSQL
npm run db:up

# 5. Generar el cliente Prisma, crear las tablas y cargar los datos
npm run prisma:generate
npm run prisma:migrate
npm run seed

# 6. Levantar la aplicación (terminal 1)
npm run dev

# 7. Levantar el worker (terminal 2)
npm run worker
```

Abra http://localhost:3000 e ingrese con un usuario de la sección 3.3.

Para detener: `Ctrl+C` en ambas terminales y `npm run db:down` (los datos se conservan en el
volumen de Docker).

### 4.2 Recorrido de demostración

1. **Estudiante** (CU-01): *Solicitud* → completar los datos, adjuntar la nota de aceptación en PDF, aceptar el consentimiento y enviar. Use un rango de al menos 6 meses.
2. **Vicedecanato** (CU-02): *Bandeja* → abrir la solicitud, marcar los tres requisitos, adjuntar la recomendación de la Comisión, indicar Jefe de Departamento y fecha, y aprobar.
3. **Vicedecanato** (CU-03): *Formalizar* → elegir la solicitud, confirmar asesor y supervisor, adjuntar el convenio. Se crean los 6 períodos, visibles en *Prácticas*.
4. **Asesor**: *Mis estudiantes* → la práctica aparece asignada.
5. **Supervisor** (CU-03): el worker imprime el enlace `/invitaciones/<token>` en su consola. Aún no existe pantalla para ese enlace (P-02), por lo que se acepta por API con el token copiado:

```bash
# Bash
curl -X POST http://localhost:3000/api/invitaciones/<token>/aceptacion -H "Content-Type: application/json" -d '{"nombre":"Roberto Sanchez","contrasena":"Super12345"}'
```

```powershell
# PowerShell
Invoke-RestMethod -Method Post http://localhost:3000/api/invitaciones/<token>/aceptacion -ContentType "application/json" -Body '{"nombre":"Roberto Sanchez","contrasena":"Super12345"}'
```

Después, el supervisor puede iniciar sesión con su correo y esa contraseña.

### 4.3 Problemas frecuentes

| Síntoma                              | Solución                                                                 |
|--------------------------------------|--------------------------------------------------------------------------|
| `Temporal is not defined`            | Use Node.js 26 o superior (`node -v`).                                   |
| Puerto 3000 ocupado                  | `npm run dev -- -p 3100` y `APP_URL="http://localhost:3100"` en `.env`.  |
| Puerto 5432 ocupado                  | Cambie el puerto en `docker-compose.yml` y en `DATABASE_URL`.            |
| Contraseña `Practica123` rechazada   | La interfaz está en modo `mock` (contraseña `demo`). Ponga `NEXT_PUBLIC_API_MODE="real"` y reinicie. |
| Los correos no llegan                | Con `SMTP_HOST` vacío solo se imprimen en la consola del worker.         |

## 5. Evidencia funcional

**Resultado:** 69 comprobaciones HTTP. 63 correctas y 6 que evidencian pendientes (sección 5.6).

### 5.1 Sesión y autorización

| ID    | Prueba                                                      | Resultado obtenido |
|-------|-------------------------------------------------------------|--------------------|
| EV-01 | Inicio de sesión de estudiante, Vicedecanato y asesor       | 201                |
| EV-02 | Contraseña incorrecta / petición sin sesión                 | 401 `NO_AUTENTICADO` |
| EV-03 | Estudiante consulta la bandeja del Vicedecanato             | 403 `NO_AUTORIZADO` |
| EV-04 | Asesor descarga la nota de aceptación de una solicitud      | 403 `NO_AUTORIZADO` |
| EV-05 | Cierre de sesión / `/estudiante` sin sesión                 | 204 / 307 (redirige) |

### 5.2 CU-01 Solicitar práctica

| ID    | Prueba                                                      | Resultado obtenido |
|-------|-------------------------------------------------------------|--------------------|
| EV-06 | Crear borrador y editarlo                                   | 201 `BORRADOR`; 200, versión 1 |
| EV-07 | Enviar una solicitud incompleta                             | 422 con error por campo |
| EV-08 | Crear una segunda solicitud con otra abierta (RN-02)        | 409 `CONFLICTO`    |
| EV-09 | Editar con versión obsoleta                                 | 409 `CONFLICTO`    |
| EV-10 | Archivo que no es PDF / mayor de 10 MB (RNF-09)             | 415 / 413          |
| EV-11 | Cargar la nota de aceptación en PDF                         | 201                |
| EV-12 | Duración menor a 6 meses (RN-03)                            | 422 «La duración mínima es de 6 meses (Art. 39)» |
| EV-13 | Supervisor igual al asesor sugerido (RN-04)                 | 422 (Art. 46)      |
| EV-14 | Enviar solicitud válida                                     | 200 `SOL-2026-0001`, `ENVIADA` |
| EV-15 | Editar una solicitud ya enviada                             | 409 `CONFLICTO`    |
| EV-16 | Reenviar una solicitud devuelta, conservando el número      | 200 `SOL-2026-0001`, `ENVIADA` |
| EV-17 | Crear una nueva solicitud tras un rechazo                   | 201 `BORRADOR`     |

### 5.3 CU-02 Evaluar solicitud

| ID    | Prueba                                                      | Resultado obtenido |
|-------|-------------------------------------------------------------|--------------------|
| EV-18 | Bandeja, detalle y descarga de la nota                      | 200                |
| EV-19 | Aprobar sin verificar requisitos (RN-01)                    | 422 (Art. 41)      |
| EV-20 | Devolver sin observaciones                                  | 422                |
| EV-21 | Devolver / rechazar con observaciones                       | 200 `DEVUELTA` / `RECHAZADA` |
| EV-22 | Evaluar con versión obsoleta                                | 409 `CONFLICTO`    |
| EV-23 | Dos aprobaciones simultáneas (E3)                           | Una 200 `APROBADA`, la otra 409 |

### 5.4 CU-03 Formalizar práctica

| ID    | Prueba                                                      | Resultado obtenido |
|-------|-------------------------------------------------------------|--------------------|
| EV-24 | Formalizar sin convenio                                     | 400                |
| EV-25 | Duración menor a 6 meses / asesor igual al supervisor       | 422 / 422          |
| EV-26 | Formalizar con convenio                                     | 201 `POR_INICIAR`, 6 períodos |
| EV-27 | Formalizar dos veces la misma solicitud                     | 409 `CONFLICTO`    |
| EV-28 | Reenviar invitación y usar el token anterior (E4)           | 200; 410 `VENCIDO` |
| EV-29 | Aceptar invitación e iniciar sesión como supervisor         | 200; 201           |
| EV-30 | Reutilizar el token ya aceptado                             | 410 `VENCIDO`      |

Períodos generados por EV-26 para una práctica del 2027-01-04 al 2027-07-04 (RN-03, RN-05):

| N.º | Inicio     | Cierre     | Vence informe (cierre + 15 días) |
|-----|------------|------------|----------------------------------|
| 1   | 2027-01-04 | 2027-02-03 | 2027-02-18 |
| 2   | 2027-02-04 | 2027-03-03 | 2027-03-18 |
| 3   | 2027-03-04 | 2027-04-03 | 2027-04-18 |
| 4   | 2027-04-04 | 2027-05-03 | 2027-05-18 |
| 5   | 2027-05-04 | 2027-06-03 | 2027-06-18 |
| 6   | 2027-06-04 | 2027-07-04 | 2027-07-19 |

### 5.5 Worker, auditoría y controles estáticos

| ID    | Prueba                                                      | Resultado obtenido |
|-------|-------------------------------------------------------------|--------------------|
| EV-31 | Despacho del outbox (transporte de consola)                 | 15 de 15 mensajes `ENVIADO` |
| EV-32 | Activar una práctica cuya fecha de inicio llegó (A2)        | `EN_CURSO`, auditoría `PRACTICA_INICIADA` |
| EV-33 | Vencer una invitación pasada de plazo (E4)                  | `VENCIDA`, auditoría `INVITACION_VENCIDA` |
| EV-34 | Registro de auditoría tras las pruebas                      | 10 tipos de acción registrados por usuarios |
| EV-35 | Las 11 pantallas responden                                  | 200                |
| EV-36 | `prisma:migrate` y `seed` sobre base vacía                  | Correcto           |
| EV-37 | `npm run typecheck`                                         | Sin errores        |
| EV-38 | `npm run lint`                                              | 1 error, 1 advertencia (P-08) |
| EV-39 | `npm run build`                                             | **Falla** (P-01)   |

Salida real del worker:

```text
[worker] iniciado
[correo:log] -> vicedecanato@utp.ac.pa | SGPP FISC: SolicitudEnviada | Nueva solicitud de practica SOL-2026-0001 por evaluar.
[correo:log] -> estudiante@utp.ac.pa | SGPP FISC: SolicitudDevuelta | Su solicitud fue devuelta con observaciones: Corrija
[worker] activarPracticas: 1
[worker] vencerInvitaciones: 1
[correo:log] -> estudiante@utp.ac.pa | SGPP FISC: SolicitudAprobada | Su solicitud de practica fue aprobada.
[correo:log] -> asesor1@utp.ac.pa | SGPP FISC: PracticaFormalizada | Fue asignado como asesor de una practica formalizada.
[worker] outbox: 15
```

(Extracto; se omiten líneas y los enlaces con token.)

### 5.6 Comprobaciones que evidencian pendientes

| Prueba                                                                | Obtenido | Pendiente |
|-----------------------------------------------------------------------|----------|-----------|
| Abrir el enlace `/invitaciones/{token}` del correo                    | 404      | P-02 |
| Aceptar invitación sin cuerpo, como lo hace la pantalla del supervisor | 400     | P-02 |
| `GET /api/invitaciones/mias`                                          | 404      | P-02 |
| `GET /api/auditoria` y `GET /api/notificaciones`                      | 404      | P-03 |
| `/asesor` sin sesión no redirige desde el servidor                    | 200      | P-07 |

Dos pruebas adicionales, fuera de las 69, confirmaron P-04 (carrera en RN-02) y P-05 (rol del supervisor).

**Alcance:** las pruebas son por HTTP; las pantallas se comprobaron por código de respuesta, sin
automatizar clics. No se probó el envío por un servidor SMTP real ni el modo `mock`. El
repositorio no incluye pruebas automatizadas.

## 6. Matriz de trazabilidad

Actualizada al 23 de noviembre de 2026. Cubre los identificadores referenciados en el código.
Estados: **Cumple** = implementado y verificado; **Parcial** = implementado con un pendiente.

### 6.1 Casos de uso

| CU    | Interfaz | API | Implementación | Evidencia | Estado |
|-------|----------|-----|----------------|-----------|--------|
| CU-01 Solicitar | `/estudiante/solicitud`, `/estudiante/solicitudes` | `/api/solicitudes`, `/{id}`, `/{id}/documentos`, `/{id}/envio`, `/mias` | `guardarSolicitud`, `cargarDocumento`, `enviarSolicitud` | EV-06 a EV-17 | Cumple |
| CU-02 Evaluar | `/vicedecanato`, `/vicedecanato/evaluar/[id]` | `/api/solicitudes`, `/{id}`, `/{id}/evaluaciones`, `/api/documentos/{id}/contenido` | `evaluarSolicitud`, `consultas` | EV-18 a EV-23 | Cumple |
| CU-03 Formalizar | `/vicedecanato/formalizar`, `/vicedecanato/practicas`, `/asesor`, `/supervisor` | `/api/practicas`, `/{id}/invitaciones/reenvio`, `/api/invitaciones/{token}/aceptacion` | `formalizarPractica`, `reenviarInvitacion`, `aceptarInvitacion`, worker | EV-24 a EV-33 | Parcial: P-02 |

### 6.2 Reglas y requisitos

| ID     | Descripción (según el código)                      | Implementación | Evidencia | Estado |
|--------|----------------------------------------------------|----------------|-----------|--------|
| RN-01  | Verificación de requisitos para aprobar (Art. 41)  | `solicitudes/dominio/evaluacion.ts` | EV-19 | Cumple |
| RN-02  | Una sola solicitud en trámite por estudiante       | `guardarSolicitud.ts` | EV-08, EV-17 | Parcial: P-04 |
| RN-03  | Duración mínima de 6 meses (Art. 39) y 6 períodos  | `shared/dominio/reglas.ts`, `solicitud.ts`, `practica.ts` | EV-12, EV-25, EV-26 | Cumple |
| RN-04  | Asesor distinto del supervisor (Art. 46) y roles válidos | `solicitud.ts`, `practica.ts`, `identidadApi.ts` | EV-13, EV-25 | Parcial: P-05 |
| RN-05  | Informe mensual vence 15 días después del cierre   | `generarPeriodos` en `reglas.ts` | EV-26 | Cumple |
| RF-09  | Notificaciones en plataforma y por correo          | `modules/notificaciones` | EV-31 | Parcial: P-03 |
| RNF-01 | Autorización por rol y por recurso                 | `requerirUsuario`, casos de uso | EV-03, EV-04 | Parcial: P-07 |
| RNF-02 | Contraseña con bcrypt, sesión de 30 min, invitación de un solo uso (72 h) | `shared/auth`, `shared/crypto`, `identidad` | EV-01, EV-02, EV-28 a EV-30, EV-33 | Cumple |
| RNF-03 | Consentimiento de datos personales                 | `validarEnviable` en `solicitud.ts` | EV-07 | Cumple |
| RNF-04 | Auditoría en la misma transacción                  | `auditoria/auditoriaApi.ts` | EV-32 a EV-34 | Parcial: P-03, P-06 |
| RNF-05 | Correo asíncrono con hasta 3 intentos              | `worker/despachadorOutbox.ts` | EV-31 | Parcial: reintentos sin probar |
| RNF-09 | Solo PDF de hasta 10 MB, fuera de la base          | `shared/pdf` | EV-10, EV-11 | Cumple |

### 6.3 Pendientes conocidos

| ID   | Pendiente | Afecta |
|------|-----------|--------|
| P-01 | `npm run build` falla: `usePathname()` fuera de `<Suspense>` en `/vicedecanato/evaluar/[id]`. | Despliegue en producción |
| P-02 | La aceptación del supervisor funciona por API, pero no existe la pantalla `/invitaciones/{token}` ni `GET /api/invitaciones/mias`, y la pantalla del supervisor no envía nombre ni contraseña. | CU-03 |
| P-03 | Las notificaciones y la auditoría se guardan, pero no existen `GET /api/notificaciones` ni `GET /api/auditoria`; en modo `real` la pantalla de auditoría sale vacía. | RF-09, RNF-04 |
| P-04 | La migración no incluye CHECK ni índices únicos parciales: con peticiones simultáneas, un estudiante logró crear dos borradores. | RN-02 |
| P-05 | Al formalizar, si el correo del supervisor ya tiene cuenta se vincula sin comprobar que su rol sea `SUPERVISOR`. | RN-04 |
| P-06 | Editar un borrador (`PUT /api/solicitudes/{id}`) no genera registro de auditoría. | RNF-04 |
| P-07 | `proxy.ts` no incluye `/asesor`; la redirección depende del cliente. La API sí exige sesión. | RNF-01 |
| P-08 | Error de lint `react-hooks/set-state-in-effect` en `app/_lib/session-context.tsx`. | Calidad |
