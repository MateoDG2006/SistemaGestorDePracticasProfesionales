"use client";

// Primitivas de formulario con soporte de error por campo (formato común §6.1).
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox as UiCheckbox } from "@/components/ui/checkbox";
import { Input as UiInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select as UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea as UiTextarea } from "@/components/ui/textarea";
import { tamano } from "../_lib/format";
import { excedePdf, mimePdfInvalido, textoLimitePdf } from "@/src/shared/dominio/reglas";

// shortcut: Base UI Select no acepta value=""; mapear vacío a centinela.
const VACIO = "__none__";

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
    <div className="block space-y-1.5">
      <Label className="text-ink">{etiqueta}</Label>
      {children}
      {hint && !error && <span className="block text-xs text-ink-soft">{hint}</span>}
      {error && (
        <span className="block text-xs font-medium text-[#616161]">⚠ {error}</span>
      )}
    </div>
  );
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
    <UiInput
      type={type}
      value={value}
      placeholder={placeholder}
      aria-invalid={!!error || undefined}
      onValueChange={onChange}
      className="h-auto rounded-[var(--radius-panel)] bg-surface px-3.5 py-2.5"
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
    <UiTextarea
      value={value}
      rows={rows}
      aria-invalid={!!error || undefined}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-[var(--radius-panel)] bg-surface px-3.5 py-2.5"
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
  // Base UI Select.Value muestra el raw value salvo que Root reciba `items`
  // (mapa value→label). Sin eso se ve el UUID o el centinela __none__.
  const items = Object.fromEntries(
    opciones.map((o) => [o.valor === "" ? VACIO : o.valor, o.etiqueta]),
  );
  const interno = value === "" ? VACIO : value;
  return (
    <UiSelect
      value={interno}
      onValueChange={(v) => onChange(!v || v === VACIO ? "" : String(v))}
      items={items}
    >
      <SelectTrigger
        aria-invalid={!!error || undefined}
        className="h-auto w-full rounded-[var(--radius-panel)] bg-surface px-3.5 py-2.5"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((o) => {
          const itemValue = o.valor === "" ? VACIO : o.valor;
          return (
            <SelectItem key={itemValue} value={itemValue}>
              {o.etiqueta}
            </SelectItem>
          );
        })}
      </SelectContent>
    </UiSelect>
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
      <UiCheckbox
        checked={checked}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5"
      />
      <span>{children}</span>
    </label>
  );
}

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
  const [localError, setLocalError] = useState<string | null>(null);
  const aviso = localError || error;

  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className={cn(
          "flex w-full items-center gap-3 rounded-[var(--radius-panel)] border border-dashed bg-surface-muted px-4 py-3 text-left text-sm transition-colors hover:bg-surface",
          aviso ? "border-[#616161]" : "border-border",
        )}
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-surface text-ink-soft">
          <Upload size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">
            {nombre ?? "Seleccionar archivo PDF"}
          </span>
          <span className="block text-xs text-ink-soft">
            {peso !== null ? tamano(peso) : `Solo PDF · máximo ${textoLimitePdf()}`}
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
          if (f && excedePdf(f.size)) {
            onSelect(null);
            setNombre(null);
            setPeso(null);
            setLocalError(`"${f.name}" supera ${textoLimitePdf()}.`);
            return;
          }
          if (f && (mimePdfInvalido(f.type) || (!f.type && !/\.pdf$/i.test(f.name)))) {
            onSelect(null);
            setNombre(null);
            setPeso(null);
            setLocalError(`"${f.name}" no es un PDF.`);
            return;
          }
          setLocalError(null);
          onSelect(f);
          setNombre(f?.name ?? null);
          setPeso(f?.size ?? null);
        }}
      />
      {aviso && (
        <span className="mt-1 block text-xs font-medium text-[#616161]">⚠ {aviso}</span>
      )}
    </div>
  );
}
