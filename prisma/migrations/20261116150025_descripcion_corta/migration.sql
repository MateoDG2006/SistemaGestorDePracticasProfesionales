-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "correo" VARCHAR(150) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "rol" VARCHAR(15) NOT NULL,
    "password_hash" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "perfil_estudiante" (
    "usuario_id" UUID NOT NULL,
    "cedula" VARCHAR(20) NOT NULL,
    "carrera" VARCHAR(150) NOT NULL,

    CONSTRAINT "perfil_estudiante_pkey" PRIMARY KEY ("usuario_id")
);

-- CreateTable
CREATE TABLE "invitacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "practica_id" UUID NOT NULL,
    "correo_destino" VARCHAR(150) NOT NULL,
    "hash_token" CHAR(64) NOT NULL,
    "vence_en" TIMESTAMPTZ(6) NOT NULL,
    "usada_en" TIMESTAMPTZ(6),
    "estado" VARCHAR(10) NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "invitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empresa" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(200) NOT NULL,
    "ruc" VARCHAR(30),
    "direccion" VARCHAR(300),
    "telefono" VARCHAR(30),
    "correo" VARCHAR(150),

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitud" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" VARCHAR(20),
    "estudiante_id" UUID NOT NULL,
    "empresa_id" UUID,
    "supervisor_nombre" VARCHAR(150),
    "supervisor_cargo" VARCHAR(100),
    "supervisor_correo" VARCHAR(150),
    "supervisor_telefono" VARCHAR(30),
    "objetivo" TEXT,
    "actividades" TEXT,
    "fecha_inicio" DATE,
    "fecha_fin" DATE,
    "asesor_sugerido_id" UUID,
    "consentimiento_datos" BOOLEAN NOT NULL DEFAULT false,
    "consentimiento_en" TIMESTAMPTZ(6),
    "estado" VARCHAR(12) NOT NULL DEFAULT 'BORRADOR',
    "version" INTEGER NOT NULL DEFAULT 0,
    "enviada_en" TIMESTAMPTZ(6),
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_solicitud" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "solicitud_id" UUID NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "ruta" VARCHAR(400) NOT NULL,
    "hash_sha256" CHAR(64) NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "subido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluacion_solicitud" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "solicitud_id" UUID NOT NULL,
    "decision" VARCHAR(10) NOT NULL,
    "asignaturas_aprobadas" BOOLEAN NOT NULL DEFAULT false,
    "indice_minimo" BOOLEAN NOT NULL DEFAULT false,
    "documentacion_completa" BOOLEAN NOT NULL DEFAULT false,
    "jefe_departamento" VARCHAR(150),
    "fecha_aprobacion_jefe" DATE,
    "documento_comision_id" UUID,
    "observaciones" TEXT,
    "evaluado_por" UUID NOT NULL,
    "evaluado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluacion_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practica" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "solicitud_id" UUID NOT NULL,
    "estudiante_id" UUID NOT NULL,
    "asesor_id" UUID NOT NULL,
    "supervisor_id" UUID,
    "supervisor_correo" VARCHAR(150) NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estado" VARCHAR(12) NOT NULL,
    "formalizada_por" UUID NOT NULL,
    "formalizada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "practica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodo_mensual" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "practica_id" UUID NOT NULL,
    "numero" SMALLINT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_cierre" DATE NOT NULL,
    "vence_informe" DATE NOT NULL,

    CONSTRAINT "periodo_mensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_practica" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "practica_id" UUID NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "ruta" VARCHAR(400) NOT NULL,
    "hash_sha256" CHAR(64) NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "subido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documento_practica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_auditoria" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" UUID,
    "accion" VARCHAR(60) NOT NULL,
    "entidad" VARCHAR(60) NOT NULL,
    "entidad_id" UUID NOT NULL,
    "datos" JSONB,
    "ocurrido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "destinatario_id" UUID NOT NULL,
    "tipo_evento" VARCHAR(40) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensaje_outbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo_evento" VARCHAR(40) NOT NULL,
    "correo_destino" VARCHAR(150) NOT NULL,
    "payload" JSONB NOT NULL,
    "estado" VARCHAR(10) NOT NULL DEFAULT 'PENDIENTE',
    "intentos" SMALLINT NOT NULL DEFAULT 0,
    "proximo_intento_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimo_error" TEXT,
    "enviado_en" TIMESTAMPTZ(6),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensaje_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_correo_key" ON "usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "perfil_estudiante_cedula_key" ON "perfil_estudiante"("cedula");

-- CreateIndex
CREATE UNIQUE INDEX "invitacion_hash_token_key" ON "invitacion"("hash_token");

-- CreateIndex
CREATE INDEX "ix_invitacion_vencimiento" ON "invitacion"("estado", "vence_en");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_nombre_ruc_key" ON "empresa"("nombre", "ruc");

-- CreateIndex
CREATE UNIQUE INDEX "solicitud_numero_key" ON "solicitud"("numero");

-- CreateIndex
CREATE INDEX "ix_solicitud_bandeja" ON "solicitud"("estado", "enviada_en");

-- CreateIndex
CREATE INDEX "ix_evaluacion_solicitud" ON "evaluacion_solicitud"("solicitud_id", "evaluado_en");

-- CreateIndex
CREATE UNIQUE INDEX "practica_solicitud_id_key" ON "practica"("solicitud_id");

-- CreateIndex
CREATE UNIQUE INDEX "ux_periodo" ON "periodo_mensual"("practica_id", "numero");

-- CreateIndex
CREATE INDEX "ix_auditoria_entidad" ON "registro_auditoria"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "ix_outbox_pendiente" ON "mensaje_outbox"("estado", "proximo_intento_en");

-- AddForeignKey
ALTER TABLE "perfil_estudiante" ADD CONSTRAINT "perfil_estudiante_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitacion" ADD CONSTRAINT "invitacion_practica_id_fkey" FOREIGN KEY ("practica_id") REFERENCES "practica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud" ADD CONSTRAINT "solicitud_asesor_sugerido_id_fkey" FOREIGN KEY ("asesor_sugerido_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_solicitud" ADD CONSTRAINT "documento_solicitud_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_solicitud" ADD CONSTRAINT "evaluacion_solicitud_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_solicitud" ADD CONSTRAINT "evaluacion_solicitud_documento_comision_id_fkey" FOREIGN KEY ("documento_comision_id") REFERENCES "documento_solicitud"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluacion_solicitud" ADD CONSTRAINT "evaluacion_solicitud_evaluado_por_fkey" FOREIGN KEY ("evaluado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practica" ADD CONSTRAINT "practica_solicitud_id_fkey" FOREIGN KEY ("solicitud_id") REFERENCES "solicitud"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practica" ADD CONSTRAINT "practica_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practica" ADD CONSTRAINT "practica_asesor_id_fkey" FOREIGN KEY ("asesor_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practica" ADD CONSTRAINT "practica_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practica" ADD CONSTRAINT "practica_formalizada_por_fkey" FOREIGN KEY ("formalizada_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "periodo_mensual" ADD CONSTRAINT "periodo_mensual_practica_id_fkey" FOREIGN KEY ("practica_id") REFERENCES "practica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_practica" ADD CONSTRAINT "documento_practica_practica_id_fkey" FOREIGN KEY ("practica_id") REFERENCES "practica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_destinatario_id_fkey" FOREIGN KEY ("destinatario_id") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
