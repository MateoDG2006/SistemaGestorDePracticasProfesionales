# Interfaz web — CU-01, CU-02, CU-03

Interfaz (solo frontend) para el Sistema de Gestión de Prácticas Profesionales de
la FISC. Construida con Next.js 16 (App Router), React 19 y Tailwind v4, con un
sistema de diseño monocromo y un layout de tipo dashboard.

El **backend** implementa la API REST y el dominio (Fase 2, Tabla 20). Esta UI la
consume mediante un cliente tipado; no contiene route handlers ni lógica de negocio.

## Cómo ejecutar

```bash
npm install
npm run dev
# http://localhost:3000  ->  redirige a /ingresar
```

Arranca en **modo demostración** (`NEXT_PUBLIC_API_MODE=mock`): datos en memoria del
navegador, sin backend ni base de datos. Accesos rápidos en la pantalla de ingreso:

| Rol          | Correo                      | Contraseña |
|--------------|-----------------------------|------------|
| Estudiante   | estudiante@utp.ac.pa        | demo       |
| Vicedecanato | vicedecanato@utp.ac.pa      | demo       |
| Supervisor   | supervisor@empresa.com      | demo       |

### Conectar al backend real

Poné `NEXT_PUBLIC_API_MODE=real` en `.env`. La UI pasará a llamar a `/api/...`.
El adaptador de demostración (`app/_lib/mock.ts`) queda sin uso y puede eliminarse.

## Estructura

```
app/
├── globals.css              Tokens del sistema de diseño monocromo (@theme)
├── ingresar/                Login (POST /api/sesiones)
├── (app)/                   Área autenticada (guard de sesión + AppShell)
│   ├── estudiante/          CU-01: inicio, solicitud (P-01), mis solicitudes
│   ├── vicedecanato/        CU-02/03: bandeja (P-02), evaluar (P-03),
│   │                        formalizar (P-04), prácticas
│   ├── supervisor/          Aceptación de invitación
│   └── auditoria/           registro_auditoria + notificaciones/outbox
├── _components/             ui, form, charts (SVG), icons, shell
└── _lib/                    api (cliente tipado), mock, types, format, sesión
```

## Paleta (Monochrome Essence)

`#FFFFFF` superficies · `#E0E0E0` bordes/relleno · `#616161` texto secundario ·
`#212121` acento primario y texto. El elemento destacado (equivalente a la tarjeta
VISA del dashboard de referencia) se representa en tinta `#212121`.

## Contrato consumido (Fase 2, Tabla 20)

- `POST`/`DELETE /api/sesiones`, `GET /api/docentes`
- `POST /api/solicitudes`, `PUT /api/solicitudes/{id}`, `GET /api/solicitudes/mias`
- `GET /api/solicitudes?estado=ENVIADA`, `GET /api/solicitudes/{id}`
- `POST /api/solicitudes/{id}/documentos`, `POST /api/solicitudes/{id}/envio`
- `POST /api/solicitudes/{id}/evaluaciones` (envía `version` → 409)
- `POST /api/practicas`, `GET /api/practicas`, `POST /api/practicas/{id}/invitaciones/reenvio`
- `POST /api/invitaciones/{token}/aceptacion`, `GET /api/documentos/{id}/contenido`

### Endpoints que el frontend necesita y NO están en la Tabla 20

El backend debe exponerlos (o se ajusta el cliente):

- `GET /api/sesiones/actual` — usuario de la sesión vigente (para el guard de rutas).
- `GET /api/invitaciones/mias` — bandeja de invitaciones del supervisor.
- `GET /api/notificaciones` — campana de notificaciones.
- `GET /api/auditoria` — vista de auditoría.

Todos los errores se esperan en el formato común `{ codigo, mensaje, campos[] }`
(§6.1); la UI los interpreta por código (422 por campo, 409 concurrencia/unicidad,
410 invitación, 413/415 PDF, 401/403 sesión).
