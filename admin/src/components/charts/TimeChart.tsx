"use client";

import { useEffect, useRef, useState } from "react";
import { SERIES_COLORS } from "@/components/charts/colors";
import { ChartTable } from "@/components/charts/ChartTable";
import type { TimePoint } from "@/lib/metrics";

type TimeChartProps = {
  points: TimePoint[];
  /** Nomes das séries, na ordem dos valores (cores fixas por posição). */
  series: string[];
  kind?: "columns" | "lines";
  /** "money" = centavos em reais. */
  format?: "count" | "money";
  /** Nome do gráfico para leitores de tela. */
  label: string;
};

const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 64 };

/** Formata o valor do eixo e da dica. */
function formatValue(value: number, format: TimeChartProps["format"], short = false): string {
  if (format === "money") {
    const reais = value / 100;
    // No eixo, valor curto para caber na margem: "R$ 100", "R$ 1,5 mil".
    if (short && reais >= 1000)
      return `R$ ${(reais / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
    if (short) return `R$ ${Math.round(reais).toLocaleString("pt-BR")}`;
    return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value.toLocaleString("pt-BR");
}

/** Máximo "redondo" do eixo e o passo das 4 linhas de grade. */
function niceScale(max: number, minTop: number): { top: number; step: number } {
  if (max < minTop) return { top: minTop, step: minTop / 4 };
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  const rounded = Math.max(1, Math.ceil(step));
  return { top: rounded * 4, step: rounded };
}

/**
 * Gráfico no tempo (colunas para uma série, linhas para até 3), em SVG, com
 * linha-guia e dica ao passar o mouse ou tocar. A tabela fica logo abaixo.
 */
export function TimeChart({
  points,
  series,
  kind = "columns",
  format = "count",
  label,
}: TimeChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(260, entry.contentRect.width)),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const max = Math.max(0, ...points.flatMap((p) => p.values));
  const { top, step } = niceScale(
    Math.ceil(max),
    // Eixo mínimo: 0–4 nas contagens e R$ 0–100 na receita (sem centavos no eixo).
    format === "money" ? 10_000 : 4,
  );
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const band = plotW / Math.max(1, points.length);
  const y = (value: number) => PAD.top + plotH - (value / top) * plotH;
  const x = (index: number) => PAD.left + band * index + band / 2;
  // No máximo ~8 rótulos no eixo X para não encavalar.
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotW / 70))));
  const barW = Math.max(2, Math.min(28, band * 0.6 - 2));
  const hovered = hover === null ? null : points[hover];

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {series.length > 1 ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label="Legenda">
          {series.map((name, i) => (
            <li key={name} className="text-muted flex items-center gap-1.5">
              <span
                aria-hidden
                className={kind === "lines" ? "h-0.5 w-4 rounded" : "size-2.5 rounded-sm"}
                style={{ background: SERIES_COLORS[i] }}
              />
              {name}
            </li>
          ))}
        </ul>
      ) : null}
      <div
        ref={box}
        className="relative w-full overflow-hidden"
        onMouseLeave={() => setHover(null)}
      >
        <svg width={width} height={HEIGHT} role="img" aria-label={label} className="block">
          {[0, 1, 2, 3, 4].map((i) => {
            const value = step * i;
            return (
              <g key={i}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(value)}
                  y2={y(value)}
                  stroke="var(--color-border)"
                  strokeDasharray={i === 0 ? undefined : "2 4"}
                />
                <text
                  x={PAD.left - 6}
                  y={y(value) + 4}
                  textAnchor="end"
                  fontSize={11}
                  fill="var(--color-muted)"
                >
                  {formatValue(value, format, true)}
                </text>
              </g>
            );
          })}
          {points.map((p, i) =>
            i % every === 0 ? (
              <text
                key={p.key}
                x={x(i)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-muted)"
              >
                {p.label}
              </text>
            ) : null,
          )}

          {hover !== null ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="var(--color-muted)"
              strokeOpacity={0.5}
            />
          ) : null}

          {kind === "columns"
            ? points.map((p, i) => {
                const value = p.values[0] ?? 0;
                if (!value) return null;
                const h = Math.max(1, PAD.top + plotH - y(value));
                const r = Math.min(4, h, barW / 2);
                const left = x(i) - barW / 2;
                const base = PAD.top + plotH;
                // Cantos arredondados só em cima; a base fica reta no eixo.
                return (
                  <path
                    key={p.key}
                    d={`M${left},${base} V${base - h + r} Q${left},${base - h} ${left + r},${base - h} H${left + barW - r} Q${left + barW},${base - h} ${left + barW},${base - h + r} V${base} Z`}
                    style={{ fill: SERIES_COLORS[0] }}
                    opacity={hover === null || hover === i ? 1 : 0.55}
                  />
                );
              })
            : series.map((name, s) => (
                <g key={name}>
                  <polyline
                    fill="none"
                    style={{ stroke: SERIES_COLORS[s] }}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={points.map((p, i) => `${x(i)},${y(p.values[s] ?? 0)}`).join(" ")}
                  />
                  {hover !== null ? (
                    <circle
                      cx={x(hover)}
                      cy={y(points[hover]?.values[s] ?? 0)}
                      r={4}
                      style={{ fill: SERIES_COLORS[s], stroke: "var(--color-surface)" }}
                      strokeWidth={2}
                    />
                  ) : null}
                </g>
              ))}

          {/* Áreas de toque maiores que as marcas: a coluna inteira do dia/mês. */}
          {points.map((p, i) => (
            <rect
              key={p.key}
              x={PAD.left + band * i}
              y={PAD.top}
              width={band}
              height={plotH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </svg>

        {hovered && hover !== null ? (
          <div
            role="status"
            className="rounded-btn border-border bg-surface-2 pointer-events-none absolute top-2 z-10 min-w-32 border px-3 py-2 text-xs shadow-lg"
            style={
              x(hover) > width / 2 ? { right: width - x(hover) + 12 } : { left: x(hover) + 12 }
            }
          >
            <p className="text-text mb-1 font-medium">{hovered.label}</p>
            {series.map((name, s) => (
              <p key={name} className="text-muted flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 rounded-sm"
                  style={{ background: SERIES_COLORS[s] }}
                />
                <span className="flex-1">{name}</span>
                <span className="text-text font-medium tabular-nums">
                  {formatValue(hovered.values[s] ?? 0, format)}
                </span>
              </p>
            ))}
          </div>
        ) : null}
      </div>
      <ChartTable
        columns={["Período", ...series]}
        rows={points.map((p) => [p.label, ...p.values.map((v) => formatValue(v, format))])}
      />
    </div>
  );
}
