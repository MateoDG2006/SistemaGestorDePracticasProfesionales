// Puerto Reloj (Fase 2, Tabla 23): permite fijar el tiempo en pruebas.
export interface Reloj {
  ahora(): Date;
}

export const relojSistema: Reloj = {
  ahora: () => new Date(),
};
