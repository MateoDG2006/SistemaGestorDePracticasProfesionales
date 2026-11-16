"use client";

// Primitivas de formulario con soporte de error por campo (formato común §6.1).
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { IconUpload } from "./icons";
import { tamano } from "../_lib/format";

export function Campo({
  etiqueta,
  error,
  children,
  hint,
}: {
  etiqueta: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{etiqueta}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && (
        <span className="mt-1 block text-xs font-medium text-[#616161]">⚠ {error}</span>
      )}
    </label>
  );
}

const baseInput =
  "w-full rounded-[var(--radius-panel)] border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-ink";

function borde(error?: string) {
  return error ? "border-[#616161]" : "border-border";
}

export function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseInput} ${borde(error)}`}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  error?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseInput} resize-y ${borde(error)}`}
    />
  );
}

export function Select({
  value,
  onChange,
  opciones,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  opciones: { valor: string; etiqueta: string }[];
  error?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${baseInput} ${borde(error)}`}
    >
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.etiqueta}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#212121]"
      />
      <span>{children}</span>
    </label>
  );
}

/** Selector de PDF con validación de tamaño/tipo del lado del cliente (413/415). */
export function ArchivoPdf({
  onSelect,
  actual,
  error,
}: {
  onSelect: (f: File | null) => void;
  actual?: string | null;
  error?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [nombre, setNombre] = useState<string | null>(actual ?? null);
  const [peso, setPeso] = useState<number | null>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={`flex w-full items-center gap-3 rounded-[var(--radius-panel)] border border-dashed bg-surface-muted px-4 py-3 text-left text-sm transition-colors hover:bg-surface ${borde(
          error,
        )}`}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-ink-soft">
          <IconUpload width={18} height={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">
            {nombre ?? "Seleccionar archivo PDF"}
          </span>
          <span className="block text-xs text-ink-soft">
            {peso !== null ? tamano(peso) : "Solo PDF · máximo 10 MB"}
          </span>
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onSelect(f);
          setNombre(f?.name ?? null);
          setPeso(f?.size ?? null);
        }}
      />
      {error && (
        <span className="mt-1 block text-xs font-medium text-[#616161]">⚠ {error}</span>
      )}
    </div>
  );
}
