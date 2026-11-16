import { mkdir, writeFile, readFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import { join, resolve, sep } from "node:path";

// Puerto AlmacenArchivos (Fase 2, D9/Tabla 23): los PDF viven fuera de la base;
// en ella solo se guardan ruta, hash y tamano. Nunca se exponen como URL publica.

const BASE = resolve(process.env.ALMACEN_ARCHIVOS_DIR ?? "./almacen_archivos");

export interface ArchivoGuardado {
  ruta: string; // relativa a la base del almacen
  hashSha256: string;
  tamanoBytes: number;
}

export async function guardarArchivo(
  buffer: Buffer,
  subcarpeta: string,
): Promise<ArchivoGuardado> {
  const dir = join(BASE, subcarpeta);
  await mkdir(dir, { recursive: true });
  const nombre = `${randomUUID()}.pdf`;
  const absoluta = join(dir, nombre);
  await writeFile(absoluta, buffer);
  const hashSha256 = createHash("sha256").update(buffer).digest("hex");
  return {
    ruta: join(subcarpeta, nombre),
    hashSha256,
    tamanoBytes: buffer.byteLength,
  };
}

export async function leerArchivo(ruta: string): Promise<Buffer> {
  const absoluta = resolve(BASE, ruta);
  // Evita path traversal: la ruta resuelta debe quedar dentro de la base.
  if (absoluta !== BASE && !absoluta.startsWith(BASE + sep)) {
    throw new Error("Ruta de archivo invalida.");
  }
  return readFile(absoluta);
}
