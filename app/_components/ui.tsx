"use client";

// Wrappers de dominio sobre primitivas shadcn (API estable para las páginas).
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, Check, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar as UiAvatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button as UiButton, buttonVariants } from "@/components/ui/button";
import { Card as UiCard } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EstadoInvitacion,
  EstadoPractica,
  EstadoSolicitud,
} from "../_lib/types";

/* ---------------- Tarjetas y estructura ---------------- */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <UiCard
      className={cn(
        "gap-0 rounded-[var(--radius-card)] py-0 shadow-card ring-foreground/5",
        className,
      )}
    >
      {children}
    </UiCard>
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
const mapaVariante = {
  primario: "default",
  secundario: "outline",
  fantasma: "ghost",
  peligro: "destructive",
} as const;

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
  const size = tamano === "sm" ? "sm" : "default";
  const variant = mapaVariante[variante];
  const clases = cn(
    "rounded-full",
    tamano === "md" && "h-auto px-5 py-2.5",
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(buttonVariants({ variant, size }), clases)}
      >
        {children}
      </Link>
    );
  }

  return (
    <UiButton
      type={tipo}
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={onClick}
      className={clases}
    >
      {children}
    </UiButton>
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
    <UiButton
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="rounded-full text-ink-soft"
    >
      {children}
    </UiButton>
  );
}

/* ---------------- Estados (chips) ---------------- */

type Tono = "solido" | "suave" | "borde" | "negativo" | "punteado";
const estilosTono: Record<Tono, string> = {
  solido: "border-transparent bg-ink text-on-ink",
  suave: "border-border bg-surface-muted text-ink",
  borde: "border-transparent bg-[#e0e0e0] text-ink",
  negativo: "border-transparent bg-[#616161] text-white",
  punteado: "border-dashed border-ink-soft bg-transparent text-ink-soft",
};

function chip(tono: Tono, texto: string) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-1", estilosTono[tono])}
    >
      {texto}
    </Badge>
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
const etiquetaPractica: Record<EstadoPractica, string> = {
  POR_INICIAR: "Por iniciar",
  EN_CURSO: "En curso",
};
export const ChipPractica = ({ estado }: { estado: EstadoPractica }) =>
  chip(mapaPractica[estado], etiquetaPractica[estado]);

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
        <ArrowUpRight size={20} className="text-white/60" />
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
    <UiAvatar
      className="bg-ink text-on-ink after:border-transparent"
      style={{ width: size, height: size }}
    >
      <AvatarFallback className="bg-ink text-xs font-semibold text-on-ink">
        {iniciales}
      </AvatarFallback>
    </UiAvatar>
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
  const Icono = tipo === "ok" ? Check : CircleAlert;
  return (
    <Alert
      variant={tipo === "error" ? "destructive" : "default"}
      className={cn(
        "rounded-[var(--radius-panel)] px-4 py-3",
        tipo === "ok" && "border-transparent bg-ink text-on-ink",
        tipo === "info" && "border-border bg-surface-muted text-ink",
        tipo === "error" && "border-[#616161] bg-surface-muted text-ink",
      )}
    >
      <Icono className="size-[18px]" />
      <AlertDescription
        className={cn(
          "text-sm text-balance",
          tipo === "ok" ? "text-on-ink" : "text-ink",
        )}
      >
        {children}
      </AlertDescription>
    </Alert>
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
    <Table>
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          {columnas.map((c) => (
            <TableHead
              key={c}
              className="px-3 py-2.5 text-xs uppercase tracking-wide text-ink-soft"
            >
              {c}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{children}</TableBody>
    </Table>
  );
}

export function Fila({ children }: { children: ReactNode }) {
  return (
    <TableRow className="border-border/70 last:border-0 hover:bg-surface-muted/60">
      {children}
    </TableRow>
  );
}

export function Celda({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <TableCell className={cn("px-3 py-3 whitespace-normal", className)}>
      {children}
    </TableCell>
  );
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
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-ink",
        className,
      )}
      role="status"
      aria-label="Cargando"
    />
  );
}
