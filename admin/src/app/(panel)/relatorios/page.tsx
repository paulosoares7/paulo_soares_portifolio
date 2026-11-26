import type { Metadata } from "next";
import Link from "next/link";
import { FileDown, Printer, Search } from "lucide-react";
import { PeriodFilter } from "@/components/charts/PeriodFilter";
import { ReportTable } from "@/components/reports/ReportTable";
import { buttonClasses } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { parsePeriod } from "@/lib/period";
import { getReport, parseReportKey, REPORT_KEYS, REPORT_LABELS } from "@/lib/reports";

export const metadata: Metadata = { title: "Relatórios" };

type Params = { relatorio?: string; periodo?: string; de?: string; ate?: string; q?: string };

/**
 * Relatórios com filtro (período e busca) e exportação em CSV e PDF
 * (página de impressão → "Salvar como PDF" do navegador).
 */
export default async function ReportsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const key = parseReportKey(params.relatorio);
  const period = parsePeriod(params);
  const q = params.q?.trim().slice(0, 100) || undefined;
  const report = await getReport(key, { period, q });

  // Mesmos filtros para o CSV e a impressão.
  const query = new URLSearchParams({ relatorio: key });
  if (report.usesPeriod) {
    query.set("periodo", period.key);
    if (period.key === "custom") {
      query.set("de", period.fromInput);
      query.set("ate", period.toInput);
    }
  }
  if (q) query.set("q", q);
  const searchLabel =
    key === "uso-disciplina" ? "disciplina" : key === "uso-aula" ? "aula" : "nome ou e-mail";

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Tabelas com filtro. Exporte em CSV (Excel) ou PDF."
        actions={
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/relatorios?${query}`}
              className={buttonClasses("secondary", "md")}
              download
            >
              <FileDown className="size-4" aria-hidden /> CSV
            </a>
            <a
              href={`/relatorios/imprimir?${query}`}
              target="_blank"
              rel="noopener"
              className={buttonClasses("secondary", "md")}
            >
              <Printer className="size-4" aria-hidden /> PDF
            </a>
          </div>
        }
      />

      <nav
        aria-label="Relatórios"
        className="border-border mb-5 flex gap-1 overflow-x-auto border-b"
      >
        {REPORT_KEYS.map((k) => (
          <Link
            key={k}
            href={{ pathname: "/relatorios", query: { relatorio: k } }}
            aria-current={k === key ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              k === key
                ? "border-accent text-accent font-medium"
                : "text-muted hover:text-text border-transparent"
            }`}
          >
            {REPORT_LABELS[k]}
          </Link>
        ))}
      </nav>

      <div className="mb-4 flex flex-col gap-3">
        <form action="/relatorios" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="relatorio" value={key} />
          {report.usesPeriod ? (
            <>
              <input type="hidden" name="periodo" value={period.key} />
              {period.key === "custom" ? (
                <>
                  <input type="hidden" name="de" value={period.fromInput} />
                  <input type="hidden" name="ate" value={period.toInput} />
                </>
              ) : null}
            </>
          ) : null}
          <label htmlFor="report-q" className="sr-only">
            Buscar por {searchLabel}
          </label>
          <input
            id="report-q"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={100}
            placeholder={`Buscar por ${searchLabel}`}
            className="rounded-btn border-border bg-surface-2 placeholder:text-muted/60 focus:border-accent h-9 w-64 max-w-full border px-3 text-sm focus:outline-none"
          />
          <button type="submit" className={buttonClasses("ghost", "sm")}>
            <Search className="size-4" aria-hidden /> Buscar
          </button>
        </form>
        {report.usesPeriod ? (
          <PeriodFilter period={period} basePath="/relatorios" keep={{ relatorio: key, q }} />
        ) : null}
      </div>

      <p className="text-muted mb-3 text-sm">
        {report.description}{" "}
        <span className="text-text font-medium">{report.rows.length} linha(s).</span>
      </p>
      <ReportTable report={report} />
    </>
  );
}
