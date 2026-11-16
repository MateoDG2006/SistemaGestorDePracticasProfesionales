"use client";

// Marco de la aplicación: barra lateral de íconos + barra superior con nav en
// "pills", buscador, notificaciones y usuario. Estilo dashboard.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useSesion } from "../_lib/session-context";
import { listarNotificaciones } from "../_lib/api";
import {
  LuBell,
  LuBriefcase,
  LuFileText,
  LuInbox,
  LuLayoutGrid,
  LuLogOut,
  LuMail,
  LuSearch,
  LuShield,
  LuSquareCheck,
} from "react-icons/lu";
import type { IconType } from "react-icons";
import { RUTA_INICIO } from "@/src/shared/dominio/reglas";
import { Avatar, Spinner } from "./ui";

interface Item {
  href: string;
  etiqueta: string;
  icono: IconType;
}

const NAV: Record<string, Item[]> = {
  ESTUDIANTE: [
    { href: RUTA_INICIO.ESTUDIANTE, etiqueta: "Inicio", icono: LuLayoutGrid },
    { href: "/estudiante/solicitud", etiqueta: "Solicitud", icono: LuFileText },
    { href: "/estudiante/solicitudes", etiqueta: "Mis solicitudes", icono: LuSquareCheck },
  ],
  VICEDECANATO: [
    { href: RUTA_INICIO.VICEDECANATO, etiqueta: "Bandeja", icono: LuInbox },
    { href: "/vicedecanato/formalizar", etiqueta: "Formalizar", icono: LuSquareCheck },
    { href: "/vicedecanato/practicas", etiqueta: "Prácticas", icono: LuBriefcase },
  ],
  SUPERVISOR: [
    { href: RUTA_INICIO.SUPERVISOR, etiqueta: "Invitaciones", icono: LuMail },
  ],
  ASESOR: [{ href: RUTA_INICIO.ASESOR, etiqueta: "Bandeja", icono: LuInbox }],
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
    listarNotificaciones()
      .then((ns) => setNoLeidas(ns.filter((n) => !n.leida).length))
      .catch(() => {});
  }, []);

  if (cargando || !usuario) {
    return (
      <>
        <div className="grid min-h-screen place-items-center">
          <Spinner />
        </div>
        <div hidden aria-hidden>
          {children}
        </div>
      </>
    );
  }

  const items = NAV[usuario.rol] ?? [];
  const rolLabel =
    { ESTUDIANTE: "Estudiante", VICEDECANATO: "Vicedecanato", SUPERVISOR: "Supervisor", ASESOR: "Asesor" }[
      usuario.rol
    ] ?? usuario.rol;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1320px] gap-4 p-4">
      {/* Barra lateral de íconos */}
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-16 shrink-0 flex-col items-center justify-between rounded-[var(--radius-card)] bg-surface py-5 shadow-card sm:flex">
        <div className="flex flex-col items-center gap-2">
          <Link
            href={items[0]?.href ?? "/"}
            className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-ink text-on-ink text-sm font-bold"
          >
            S
          </Link>
          {items.map((it) => {
            const on = activo(pathname, it.href);
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
                <it.icono size={20} />
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
            <LuShield size={20} />
          </Link>
          <button
            onClick={salir}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid h-11 w-11 place-items-center rounded-2xl text-ink-soft transition-colors hover:bg-surface-muted"
          >
            <LuLogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {/* Barra superior */}
        <header className="flex items-center justify-between gap-4 rounded-[var(--radius-card)] bg-surface px-4 py-3 shadow-card">
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
              <LuSearch size={20} />
            </button>
            <Link
              href="/auditoria"
              aria-label="Notificaciones"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-border text-ink-soft hover:bg-surface-muted"
            >
              <LuBell size={20} />
              {noLeidas > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-ink px-1 text-[10px] font-semibold text-on-ink">
                  {noLeidas}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3">
              <Avatar nombre={usuario.nombre} size={32} />
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium text-ink">{usuario.nombre}</p>
                <p className="text-xs text-ink-soft">{rolLabel}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-4 pb-6">{children}</main>
      </div>
    </div>
  );
}
