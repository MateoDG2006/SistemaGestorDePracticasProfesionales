// Utilidades de formato para la interfaz.

/** YYYY-MM-DD -> DD/MM/YYYY */
export function fecha(s: string | null | undefined): string {
  if (!s) return "—";
  const iso = s.slice(0, 10);
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

/** ISO -> fecha y hora local corta */
export function fechaHora(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString("es-PA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function tamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function horasRestantes(iso: string): number {
  return Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 3600e3));
}

/** Primer nombre útil para saludos (omite Dr., Dra., Lic., Ing., …). */
export function primerNombre(nombre: string | null | undefined): string {
  if (!nombre) return "";
  const partes = nombre.split(/\s+/).filter(Boolean);
  if (partes.length >= 2 && /^(dr|dra|lic|ing|sr|sra)\.?$/i.test(partes[0])) {
    return partes[1];
  }
  return partes[0] ?? "";
}
