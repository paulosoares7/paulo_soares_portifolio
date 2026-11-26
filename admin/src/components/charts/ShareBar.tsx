import { SERIES_COLORS } from "@/components/charts/colors";

/**
 * Uma barra dividida em partes (até 3), com legenda que traz o número e a
 * porcentagem de cada parte (a cor nunca é a única pista).
 * @param parts Nome e valor de cada parte, na ordem das cores.
 */
export function ShareBar({ parts }: { parts: { label: string; value: number }[] }) {
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  const percent = (value: number) => (total ? Math.round((value / total) * 100) : 0);
  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex h-4 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={parts.map((p) => `${p.label}: ${p.value}`).join(", ")}
      >
        {total ? (
          parts.map((p, i) =>
            p.value ? (
              <div
                key={p.label}
                title={`${p.label}: ${p.value} (${percent(p.value)}%)`}
                className="h-full transition-[flex-grow] duration-500 first:rounded-l-full last:rounded-r-full hover:brightness-125"
                style={{ flexGrow: p.value, background: SERIES_COLORS[i] }}
              />
            ) : null,
          )
        ) : (
          <div className="bg-surface-2 h-full flex-1" />
        )}
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {parts.map((p, i) => (
          <li key={p.label} className="flex items-start gap-2">
            <span
              aria-hidden
              className="mt-1.5 size-2.5 shrink-0 rounded-sm"
              style={{ background: SERIES_COLORS[i] }}
            />
            <span className="flex flex-col">
              <span className="text-muted text-xs">{p.label}</span>
              <span className="text-text text-xl font-semibold tabular-nums">
                {p.value}{" "}
                <span className="text-muted text-xs font-normal">{percent(p.value)}%</span>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
