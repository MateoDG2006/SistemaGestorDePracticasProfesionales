import { Suspense } from "react";
import { SesionProvider } from "../_lib/session-context";
import { AppShell } from "../_components/shell";
import { EsqueletoPagina } from "../_components/ui";

// Layout protegido: el Server Component SIEMPRE monta `{children}` (vía
 // Suspense) para que Next.js pueda validar instant navigation. La sesión y el
 // marco visual viven en Client Components hermanos / envolventes que no
 // pueden omitir el segmento de la página.

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SesionProvider exigir>
      <AppShell>
        <Suspense fallback={<EsqueletoPagina />}>{children}</Suspense>
      </AppShell>
    </SesionProvider>
  );
}
