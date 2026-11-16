"use client";

// Gráficos en SVG puro, monocromos. Sin librerías. Son ilustrativos del estilo
// del dashboard; los datos se pasan por props.

export function BarChart({
  datos,
  resaltar,
  alto = 180,
}: {
  datos: { etiqueta: string; valor: number }[];
  resaltar?: number; // índice de la barra destacada
  alto?: number;
}) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  const anchoBarra = 100 / (datos.length * 2);
  return (
    <svg viewBox={`0 0 100 ${alto / 2}`} className="w-full" style={{ height: alto }}>
      {datos.map((d, i) => {
        const h = (d.valor / max) * (alto / 2 - 14);
        const x = (i * 2 + 0.5) * anchoBarra;
        const y = alto / 2 - 10 - h;
        const destacada = i === resaltar;
        return (
          <g key={d.etiqueta}>
            <rect
              x={x}
              y={y}
              width={anchoBarra}
              height={h}
              rx={1.6}
              fill={destacada ? "var(--color-ink)" : "var(--color-track)"}
            />
            <text
              x={x + anchoBarra / 2}
              y={alto / 2 - 2}
              textAnchor="middle"
              fontSize={3}
              fill="var(--color-ink-soft)"
            >
              {d.etiqueta}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function AreaChart({
  valores,
  alto = 120,
}: {
  valores: number[];
  alto?: number;
}) {
  const max = Math.max(1, ...valores);
  const min = Math.min(...valores);
  const span = max - min || 1;
  const puntos = valores.map((v, i) => {
    const x = (i / (valores.length - 1)) * 100;
    const y = 36 - ((v - min) / span) * 30 - 3;
    return [x, y] as const;
  });
  const linea = puntos.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${linea} L100,36 L0,36 Z`;
  return (
    <svg viewBox="0 0 100 36" className="w-full" style={{ height: alto }}>
      <defs>
        <linearGradient id="relleno" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-ink)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-ink)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#relleno)" />
      <path d={linea} fill="none" stroke="var(--color-ink)" strokeWidth={1.1} />
    </svg>
  );
}
