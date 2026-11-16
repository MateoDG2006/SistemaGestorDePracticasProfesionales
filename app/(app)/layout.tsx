import { SesionProvider } from "../_lib/session-context";
import { AppShell } from "../_components/shell";

// Layout protegido: exige sesión (redirige a /ingresar si no hay) y monta el
// marco de la aplicación. Toda la resolución de sesión ocurre en el cliente,
// de modo que estas rutas no leen cookies en el servidor (compatible con
// cacheComponents).

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SesionProvider exigir>
      <AppShell>{children}</AppShell>
    </SesionProvider>
  );
}
