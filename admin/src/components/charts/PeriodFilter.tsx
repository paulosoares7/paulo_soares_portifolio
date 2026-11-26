import Link from "next/link";
import { CalendarRange } from "lucide-react";
import { PERIOD_OPTIONS, type Period } from "@/lib/period";

/**
 * Filtro de período numa linha só: 7 dias, 30 dias, 12 meses e
 * personalizado (duas datas). Funciona pela URL (dá para salvar o link).
 * @param period Período atual.
 * @param basePath Página que recebe o filtro.
 * @param keep Outros filtros da URL para manter.
 */
export function PeriodFilter({
  period,
  basePath,
  keep = {},
}: {
  period: Period;
  basePath: string;
  keep?: Record<string, string | undefined>;
}) {
  const kept = Object.fromEntries(Object.entries(keep).filter(([, v]) => v)) as Record<
    string,
    string
  >;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <nav aria-label="Período" className="rounded-btn border-border bg-surface flex border p-0.5">
        {PERIOD_OPTIONS.filter((o) => o.key !== "custom").map((o) => {
          const active = period.key === o.key;
          return (
            <Link
              key={o.key}
              href={{ pathname: basePath, query: { ...kept, periodo: o.key } }}
              aria-current={active ? "true" : undefined}
              scroll={false}
              className={`rounded-btn px-3 py-1.5 text-sm transition-colors ${
                active ? "bg-accent/15 text-accent font-medium" : "text-muted hover:text-text"
              }`}
            >
              {o.label}
            </Link>
          );
        })}
      </nav>
      <form action={basePath} className="flex flex-wrap items-center gap-2">
        {Object.entries(kept).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <input type="hidden" name="periodo" value="custom" />
        <label className="sr-only" htmlFor="periodo-de">
          De
        </label>
        <input
          id="periodo-de"
          name="de"
          type="date"
          required
          defaultValue={period.fromInput}
          className={`rounded-btn border-border bg-surface-2 h-9 border px-2 text-sm ${period.key === "custom" ? "border-accent" : ""}`}
        />
        <span className="text-muted text-sm">a</span>
        <label className="sr-only" htmlFor="periodo-ate">
          Até
        </label>
        <input
          id="periodo-ate"
          name="ate"
          type="date"
          required
          defaultValue={period.toInput}
          className={`rounded-btn border-border bg-surface-2 h-9 border px-2 text-sm ${period.key === "custom" ? "border-accent" : ""}`}
        />
        <button
          type="submit"
          className="rounded-btn border-accent text-accent hover:bg-accent/10 inline-flex h-9 items-center gap-2 border px-3 text-sm"
        >
          <CalendarRange className="size-4" aria-hidden />
          Personalizado
        </button>
      </form>
      <span className="text-muted text-xs">{period.label}</span>
    </div>
  );
}
