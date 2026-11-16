"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, API_MODE, iniciarSesion, sesionActual } from "../_lib/api";
import { RUTA_INICIO } from "@/src/shared/dominio/reglas";
import { Button, Mensaje, Spinner } from "../_components/ui";
import { Campo, Input } from "../_components/form";

const DEMO = [
  { correo: "estudiante@utp.ac.pa", rol: "Estudiante" },
  { correo: "vicedecanato@utp.ac.pa", rol: "Vicedecanato" },
  { correo: "supervisor@empresa.com", rol: "Supervisor" },
];

export default function Ingresar() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    let vivo = true;
    sesionActual()
      .then((u) => {
        if (!vivo) return;
        if (u) router.replace(RUTA_INICIO[u.rol] ?? "/");
        else setVerificando(false);
      })
      .catch(() => {
        if (vivo) setVerificando(false);
      });
    return () => {
      vivo = false;
    };
  }, [router]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const u = await iniciarSesion(correo, password);
      router.replace(RUTA_INICIO[u.rol] ?? "/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  if (verificando) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-ink text-lg font-bold text-on-ink">
            S
          </div>
          <h1 className="text-xl font-semibold text-ink">Prácticas Profesionales FISC</h1>
          <p className="text-sm text-ink-soft">Sistema de Gestión · inicie sesión</p>
        </div>

        <form
          onSubmit={entrar}
          className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-surface p-6 shadow-card"
        >
          {error && <Mensaje tipo="error">{error}</Mensaje>}
          <Campo etiqueta="Correo institucional">
            <Input value={correo} onChange={setCorreo} type="email" placeholder="usuario@utp.ac.pa" />
          </Campo>
          <Campo etiqueta="Contraseña">
            <Input value={password} onChange={setPassword} type="password" placeholder="••••••••" />
          </Campo>
          <Button tipo="submit" disabled={enviando} className="w-full">
            {enviando ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : "Ingresar"}
          </Button>
        </form>

        {API_MODE === "mock" && (
          <div className="mt-4 rounded-[var(--radius-panel)] border border-border bg-surface-muted p-4 text-xs text-ink-soft">
            <p className="mb-2 font-medium text-ink">Modo demostración — acceso rápido:</p>
            <div className="flex flex-col gap-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.correo}
                  type="button"
                  onClick={() => {
                    setCorreo(d.correo);
                    setPassword("demo");
                  }}
                  className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 text-left transition-colors hover:bg-ink hover:text-on-ink"
                >
                  <span className="font-medium">{d.rol}</span>
                  <span className="opacity-70">{d.correo}</span>
                </button>
              ))}
            </div>
            <p className="mt-2">Contraseña: <span className="font-mono">demo</span></p>
          </div>
        )}
      </div>
    </div>
  );
}
