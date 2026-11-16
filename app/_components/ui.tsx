"use client";

// Componentes base del sistema de diseño monocromo.
import Link from "next/link";
import type { ReactNode } from "react";
import {
  EstadoInvitacion,
  EstadoPractica,
  EstadoSolicitud,
} from "../_lib/types";
import { IconAlert, IconArrowUpRight, IconCheck, IconX } from "./icons";

/* ---------------- Tarjetas y estructura ---------------- */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] bg-surface shadow-card ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  titulo,
  subtitulo,
  accion,
}: {
  titulo: string;
  subtitulo?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-ink">{titulo}</h2>
        {subtitulo && <p className="text-sm text-ink-soft">{subtitulo}</p>}
      </div>
      {accion}
    </div>
  );
}

export function PageHeader({
  saludo,
  nombre,
  children,
}: {
  saludo: string;
  nombre?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        {saludo} {nombre && <span className="text-ink-soft">{nombre}</span>}
      </h1>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

/* ---------------- Botones ---------------- */

type Variante = "primario" | "secundario" | "fantasma" | "peligro";
const estilosBtn: Record<Variante, string> = {
  primario: "bg-ink text-on-ink hover:bg-black",
  secundario: "bg-surface text-ink border border-border hover:bg-surface-muted",
  fantasma: "text-ink-soft hover:bg-surface-muted",
  peligro: "bg-[#616161] text-white hover:bg-[#4a4a4a]",
};

export function Button({
  children,
  variante = "primario",
  tamano = "md",
  href,
  tipo = "button",
  disabled,
  onClick,
  className = "",
}: {
  children: ReactNode;
  variante?: Variante;
  tamano?: "sm" | "md";
  href?: string;
  tipo?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const base = `inline-flex items-center justify-center gap-2 rounded-[var(--radius-pill)] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${
    tamano === "sm" ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5 text-sm"
  } ${estilosBtn[variante]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }
  return (
    <button type={tipo} disabled={disabled} onClick={onClick} className={base}>
      {children}
    </button>
  );
}

export function IconButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-10 w-10 place-items-center rounded-full border border-border bg-surface text-ink-soft transition-colors hover:bg-surface-muted"
    >
      {children}
    </button>
  );
}

/* ---------------- Estados (chips) ---------------- */

type Tono = "solido" | "suave" | "borde" | "negativo" | "punteado";
const estilosTono: Record<Tono, string> = {
  solido: "bg-ink text-on-ink",
  suave: "bg-surface-muted text-ink border border-border",
  borde: "bg-[#e0e0e0] text-ink",
  negativo: "bg-[#616161] text-white",
  punteado: "border border-dashed border-ink-soft text-ink-soft",
};

function chip(tono: Tono, texto: string) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${estilosTono[tono]}`}
    >
      {texto}
    </span>
  );
}

const mapaSolicitud: Record<EstadoSolicitud, Tono> = {
  BORRADOR: "punteado",
  ENVIADA: "suave",
  DEVUELTA: "borde",
  APROBADA: "solido",
  RECHAZADA: "negativo",
};
const etiquetaSolicitud: Record<EstadoSolicitud, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  DEVUELTA: "Devuelta",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
};
export const ChipSolicitud = ({ estado }: { estado: EstadoSolicitud }) =>
  chip(mapaSolicitud[estado], etiquetaSolicitud[estado]);

const mapaPractica: Record<EstadoPractica, Tono> = {
  POR_INICIAR: "suave",
  EN_CURSO: "solido",
};
export const ChipPractica = ({ estado }: { estado: EstadoPractica }) =>
  chip(mapaPractica[estado], estado === "EN_CURSO" ? "En curso" : "Por iniciar");

const mapaInvitacion: Record<EstadoInvitacion, Tono> = {
  PENDIENTE: "suave",
  USADA: "solido",
  VENCIDA: "negativo",
  REVOCADA: "borde",
};
const etiquetaInvitacion: Record<EstadoInvitacion, string> = {
  PENDIENTE: "Pendiente",
  USADA: "Aceptada",
  VENCIDA: "Vencida",
  REVOCADA: "Revocada",
};
export const ChipInvitacion = ({ estado }: { estado: EstadoInvitacion }) =>
  chip(mapaInvitacion[estado], etiquetaInvitacion[estado]);

/* ---------------- Tarjetas de métrica ---------------- */

export function StatCard({
  etiqueta,
  valor,
  pie,
}: {
  etiqueta: string;
  valor: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-ink-soft">{etiqueta}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{valor}</p>
      {pie && <p className="mt-1 text-xs text-ink-soft">{pie}</p>}
    </Card>
  );
}

/** Tarjeta destacada en tinta oscura (equivalente a la tarjeta VISA del dashboard). */
export function HighlightCard({
  titulo,
  children,
  pie,
}: {
  titulo: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] bg-ink p-5 text-on-ink shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/70">{titulo}</p>
        <IconArrowUpRight className="text-white/60" />
      </div>
      <div className="mt-6">{children}</div>
      {pie && <div className="mt-6 text-sm text-white/70">{pie}</div>}
    </div>
  );
}

/* ---------------- Avatar ---------------- */

export function Avatar({ nombre, size = 36 }: { nombre: string; size?: number }) {
  const iniciales = nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full bg-ink text-xs font-semibold text-on-ink"
      style={{ width: size, height: size }}
    >
      {iniciales}
    </span>
  );
}

/* ---------------- Mensajes en línea ---------------- */

export function Mensaje({
  tipo,
  children,
}: {
  tipo: "ok" | "error" | "info";
  children: ReactNode;
}) {
  const estilo =
    tipo === "ok"
      ? "bg-ink text-on-ink"
      : tipo === "error"
        ? "border border-[#616161] bg-surface-muted text-ink"
        : "border border-border bg-surface-muted text-ink";
  const Icono = tipo === "ok" ? IconCheck : tipo === "error" ? IconAlert : IconAlert;
  return (
    <div
      className={`flex items-start gap-2.5 rounded-[var(--radius-panel)] px-4 py-3 text-sm ${estilo}`}
    >
      <Icono className="mt-0.5 shrink-0" width={18} height={18} />
      <div>{children}</div>
    </div>
  );
}

/* ---------------- Tabla ---------------- */

export function Tabla({
  columnas,
  children,
}: {
  columnas: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
            {columnas.map((c) => (
              <th key={c} className="px-3 py-2.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Fila({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-border/70 last:border-0 hover:bg-surface-muted/60">
      {children}
    </tr>
  );
}
export function Celda({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-3 align-middle ${className}`}>{children}</td>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-[var(--radius-panel)] border border-dashed border-border px-6 py-12 text-center text-sm text-ink-soft">
      {children}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-ink ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}

export { IconX };
