"use client";

// Contexto de sesión del lado del cliente. Resuelve el usuario vigente con el
// cliente API (modo real: GET /api/sesiones; modo mock: almacenamiento local).
// Mantiene todo el acceso a sesión fuera del render del servidor, lo que evita
// las restricciones de cacheComponents con cookies().

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "./types";
import { cerrarSesion as apiCerrar, sesionActual } from "./api";

interface Ctx {
  usuario: Usuario | null;
  cargando: boolean;
  refrescar: () => Promise<void>;
  salir: () => Promise<void>;
}

const SesionContext = createContext<Ctx | null>(null);

export function SesionProvider({
  children,
  exigir = false,
}: {
  children: React.ReactNode;
  exigir?: boolean;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    const u = await sesionActual();
    setUsuario(u);
    setCargando(false);
    if (exigir && !u) router.replace("/ingresar");
  }, [exigir, router]);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const salir = useCallback(async () => {
    // Navegar de inmediato: si primero ponemos usuario=null, el shell muestra
    // esqueleto y parece que el cierre de sesión se quedó "cargando".
    try {
      await apiCerrar();
    } finally {
      setCargando(false);
      setUsuario(null);
      router.replace("/ingresar");
    }
  }, [router]);

  return (
    <SesionContext.Provider value={{ usuario, cargando, refrescar, salir }}>
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion(): Ctx {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesion debe usarse dentro de SesionProvider");
  return ctx;
}
