import { SERIES_COLORS } from "@/components/charts/colors";
import type { RankItem } from "@/lib/metrics";

/**
 * Ranking em barras horizontais (uma série): nome, barra proporcional e o
 * número escrito ao lado, mais um dado extra (ex.: taxa de conclusão).
 * @param items Itens já ordenados.
 * @param unit Unidade do número ("escolhas", "vezes"...).
 * @param empty Texto quando não há dados.
 */
export function BarList({
  items,
  unit,
  empty,
}: {
  items: RankItem[];
  unit: string;
  empty: string;
}) {
  if (!items.length) return <p className="text-muted py-6 text-center text-sm">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value));
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, index) => (
        <li
          key={`${item.label}-${index}`}
          className="group flex flex-col gap-1"
          title={`${item.label}: ${item.value} ${unit}${item.extra ? ` · ${item.extra}` : ""}`}
        >
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-text min-w-0 truncate">
              {item.label}
              {item.hint ? <span className="text-muted text-xs"> · {item.hint}</span> : null}
            </span>
            <span className="text-muted shrink-0 text-xs tabular-nums">
              <span className="text-text font-medium">{item.value}</span> {unit}
              {item.extra ? ` · ${item.extra}` : ""}
            </span>
          </div>
          <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full transition-[width] duration-500 group-hover:brightness-125 motion-reduce:transition-none"
              style={{
                width: `${Math.max(2, (item.value / max) * 100)}%`,
                background: SERIES_COLORS[0],
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
