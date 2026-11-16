import { registrarSuscriptoresNotificaciones } from "@/src/modules/notificaciones/aplicacion/suscriptores";

// Registra una sola vez los suscriptores de eventos. Se invoca al inicio de
// cada route handler y del worker antes de publicar eventos.
let listo = false;
export function arrancar(): void {
  if (listo) return;
  registrarSuscriptoresNotificaciones();
  listo = true;
}
