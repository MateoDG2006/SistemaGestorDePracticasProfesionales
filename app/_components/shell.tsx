"use client";

// Marco de la aplicación: barra lateral de íconos + barra superior con nav en
// "pills", buscador, notificaciones y usuario.
//
 // Cache Components / instant navigation: este shell SIEMPRE renderiza
 // `{children}` en ambas ramas (sesión cargando o lista). Omitirlos dropea el
 // segmento de la página (instant-unrendered-segment).

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Briefcase,
  FileText,
  Inbox,
  LayoutGrid,
  LogOut,
  Mail,
  Search,
  Shield,
  SquareCheck,
} from "lucide-react";
import { useSesion } from "../_lib/session-context";
import { listarNotificaciones } from "../_lib/api";
import { RUTA_INICIO } from "@/src/shared/dominio/reglas";
import { Avatar, Esqueleto } from "./ui";

interface Item {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
}

const NAV: Record<string, Item[]> = {
  ESTUDIANTE: [
    { href: RUTA_INICIO.ESTUDIANTE, etiqueta: "Inicio", icono: LayoutGrid },
    { href: "/estudiante/solicitud", etiqueta: "Solicitud", icono: FileText },
    { href: "/estudiante/solicitudes", etiqueta: "Mis solicitudes", icono: SquareCheck },
  ],
  VICEDECANATO: [
    { href: RUTA_INICIO.VICEDECANATO, etiqueta: "Bandeja", icono: Inbox },
    { href: "/vicedecanato/formalizar", etiqueta: "Formalizar", icono: SquareCheck },
    { href: "/vicedecanato/practicas", etiqueta: "Prácticas", icono: Briefcase },
  ],
  SUPERVISOR: [
    { href: RUTA_INICIO.SUPERVISOR, etiqueta: "Invitaciones", icono: Mail },
  ],
  ASESOR: [
    { href: RUTA_INICIO.ASESOR, etiqueta: "Mis estudiantes", icono: Briefcase },
  ],
};

function activo(pathname: string, href: string) {
  if ((Object.values(RUTA_INICIO) as string[]).includes(href)) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario, cargando, salir } = useSesion();
  const pathname = usePathname();
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    if (!usuario) return;
    listarNotificaciones()
      .then((ns) => setNoLeidas(ns.filter((n) => !n.leida).length))
      .catch(() => {});
  }, [usuario]);

  const items = usuario ? (NAV[usuario.rol] ?? []) : [];
  const rolLabel = usuario
    ? ({ ESTUDIANTE: "Estudiante", VICEDECANATO: "Vicedecanato", SUPERVISOR: "Supervisor", ASESOR: "Asesor" }[
        usuario.rol
      ] ?? usuario.rol)
    : "";
  // Solo el arranque inicial: si !usuario tras logout, no pintar esqueleto
  // (queda como "cargando" eterno hasta que /ingresar termine de montar).
  const mostrandoEsqueleto = cargando;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1320px] gap-4 p-4">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-16 shrink-0 flex-col items-center justify-between rounded-[var(--radius-card)] bg-surface py-5 shadow-card sm:flex">
        {mostrandoEsqueleto ? (
          <>
            <div className="flex flex-col items-center gap-3">
              <Esqueleto className="mb-3 h-10 w-10 rounded-full" />
              <Esqueleto className="h-11 w-11 rounded-2xl" />
              <Esqueleto className="h-11 w-11 rounded-2xl" />
              <Esqueleto className="h-11 w-11 rounded-2xl" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Esqueleto className="h-11 w-11 rounded-2xl" />
              <Esqueleto className="h-11 w-11 rounded-2xl" />
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <Link
                href={items[0]?.href ?? "/"}
                className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-ink text-on-ink text-sm font-bold"
              >
                S
              </Link>
              {items.map((it) => {
                const on = activo(pathname, it.href);
                const Icono = it.icono;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    aria-label={it.etiqueta}
                    title={it.etiqueta}
                    className={`grid h-11 w-11 place-items-center rounded-2xl transition-colors ${
                      on ? "bg-ink text-on-ink" : "text-ink-soft hover:bg-surface-muted"
                    }`}
                  >
                    <Icono size={20} />
                  </Link>
                );
              })}
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/auditoria"
                aria-label="Auditoría"
                title="Auditoría y notificaciones"
                className={`grid h-11 w-11 place-items-center rounded-2xl transition-colors ${
                  activo(pathname, "/auditoria") ? "bg-ink text-on-ink" : "text-ink-soft hover:bg-surface-muted"
                }`}
              >
                <Shield size={20} />
              </Link>
              <button
                onClick={salir}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="grid h-11 w-11 place-items-center rounded-2xl text-ink-soft transition-colors hover:bg-surface-muted"
              >
                <LogOut size={20} />
              </button>
            </div>
          </>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <header className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-surface px-4 py-3 shadow-card">
          {mostrandoEsqueleto ? (
            <>
              <Esqueleto className="hidden h-4 w-24 md:block" />
              <Esqueleto className="h-9 w-64 rounded-full" />
              <div className="flex items-center gap-2">
                <Esqueleto className="hidden h-10 w-10 rounded-full md:block" />
                <Esqueleto className="h-10 w-10 rounded-full" />
                <Esqueleto className="h-10 w-36 rounded-full" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="hidden text-sm font-semibold text-ink md:block">SGPP · FISC</span>
              </div>
              <nav className="flex items-center gap-1 rounded-full bg-surface-muted p-1">
                {items.map((it) => {
                  const on = activo(pathname, it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                        on ? "bg-ink text-on-ink" : "text-ink-soft hover:text-ink"
                      }`}
                    >
                      {it.etiqueta}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center gap-2">
                <button
                  aria-label="Buscar"
                  className="hidden h-10 w-10 place-items-center rounded-full border border-border text-ink-soft hover:bg-surface-muted md:grid"
                >
                  <Search size={20} />
                </button>
                <Link
                  href="/auditoria"
                  aria-label="Notificaciones"
                  className="relative grid h-10 w-10 place-items-center rounded-full border border-border text-ink-soft hover:bg-surface-muted"
                >
                  <Bell size={20} />
                  {noLeidas > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-on-ink">
                      {noLeidas}
                    </span>
                  )}
                </Link>
                {usuario && (
                  <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
                    <Avatar nombre={usuario.nombre} size={32} />
                    <div className="hidden leading-tight sm:block">
                      <p className="text-sm font-medium text-ink">{usuario.nombre}</p>
                      <p className="text-xs text-ink-soft">{rolLabel}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </header>

        {/* children siempre en el árbol — requerido para instant-navigation */}
        <main className="flex flex-col gap-4 pb-6">{children}</main>
      </div>
    </div>
  );
}
