// Errores de dominio/aplicacion con su mapeo a codigos HTTP y al formato
// comun de error de la API (Fase 2, seccion 6.1).

export interface CampoError {
  campo: string;
  error: string;
}

export class AppError extends Error {
  readonly codigo: string;
  readonly httpStatus: number;
  readonly campos?: CampoError[];

  constructor(codigo: string, httpStatus: number, mensaje: string, campos?: CampoError[]) {
    super(mensaje);
    this.name = codigo;
    this.codigo = codigo;
    this.httpStatus = httpStatus;
    this.campos = campos;
  }
}

// 422 - regla de negocio incumplida o validacion de dominio
export class ErrorValidacion extends AppError {
  constructor(mensaje: string, campos?: CampoError[]) {
    super("VALIDACION", 422, mensaje, campos);
  }
}

// 400 - peticion mal formada
export class ErrorPeticion extends AppError {
  constructor(mensaje: string, campos?: CampoError[]) {
    super("PETICION_INVALIDA", 400, mensaje, campos);
  }
}

// 401 - sin sesion
export class ErrorNoAutenticado extends AppError {
  constructor(mensaje = "Debe iniciar sesion.") {
    super("NO_AUTENTICADO", 401, mensaje);
  }
}

// 403 - sin permiso sobre el recurso (RNF-01)
export class ErrorNoAutorizado extends AppError {
  constructor(mensaje = "No tiene permiso sobre este recurso.") {
    super("NO_AUTORIZADO", 403, mensaje);
  }
}

// 404
export class ErrorNoEncontrado extends AppError {
  constructor(mensaje = "Recurso no encontrado.") {
    super("NO_ENCONTRADO", 404, mensaje);
  }
}

// 409 - conflicto de estado o de version (RN-02, CU-02 E3)
export class ErrorConflicto extends AppError {
  constructor(mensaje: string, campos?: CampoError[]) {
    super("CONFLICTO", 409, mensaje, campos);
  }
}

// 410 - recurso vencido (invitacion vencida o usada)
export class ErrorVencido extends AppError {
  constructor(mensaje = "El recurso vencio o ya fue utilizado.") {
    super("VENCIDO", 410, mensaje);
  }
}

// 413 - archivo demasiado grande (RNF-09)
export class ErrorArchivoGrande extends AppError {
  constructor(mensaje = "El archivo supera el limite de 10 MB.") {
    super("ARCHIVO_GRANDE", 413, mensaje);
  }
}

// 415 - tipo de archivo no permitido (RNF-09)
export class ErrorTipoArchivo extends AppError {
  constructor(mensaje = "Solo se aceptan archivos PDF.") {
    super("TIPO_NO_PERMITIDO", 415, mensaje);
  }
}
