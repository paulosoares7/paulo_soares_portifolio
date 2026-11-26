import type { Metadata } from "next";
import { AutoPrint } from "@/components/reports/AutoPrint";
import { ReportTable } from "@/components/reports/ReportTable";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { getReport, parseReportKey } from "@/lib/reports";

export const metadata: Metadata = { title: "Imprimir relatório" };
export const dynamic = "force-dynamic";

/**
 * Versão do relatório para impressão (fundo branco, sem menu). Abre a janela
 * de imprimir sozinha; "Salvar como PDF" gera o arquivo.
 */
export default async function PrintReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    relatorio?: string;
    periodo?: string;
    de?: string;
    ate?: string;
    q?: string;
  }>;
}) {
  // Fora do layout do painel: a sessão é conferida aqui.
  const admin = await requireAdmin();
  const params = await searchParams;
  const period = parsePeriod(params);
  const q = params.q?.trim().slice(0, 100) || undefined;
  const report = await getReport(parseReportKey(params.relatorio), { period, q });

  return (
    <div className="min-h-screen bg-white px-8 py-8 text-gray-900 print:p-0">
      <AutoPrint />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-2xl font-semibold">Relatório: {report.title}</h1>
          <p className="text-sm text-gray-600">{report.description}</p>
          <p className="text-sm text-gray-600">
            {report.usesPeriod ? `Período: ${period.label}. ` : ""}
            {q ? `Busca: "${q}". ` : ""}
            {report.rows.length} linha(s).
          </p>
        </div>
        <p className="text-xs text-gray-500">
          Gerado em {formatDateTime(new Date())} por {admin.name}
        </p>
      </header>
      <ReportTable report={report} print />
    </div>
  );
}
