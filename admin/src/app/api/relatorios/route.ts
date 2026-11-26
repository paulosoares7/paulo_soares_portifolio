import { requireAdmin } from "@/lib/auth";
import { parsePeriod } from "@/lib/period";
import { getReport, parseReportKey, reportToCsv } from "@/lib/reports";

/**
 * Baixa um relatório em CSV (mesmos filtros da página:
 * ?relatorio=&periodo=&de=&ate=&q=). Só para o admin logado.
 * @param request Requisição com os filtros na URL.
 * @returns Arquivo CSV.
 */
export async function GET(request: Request): Promise<Response> {
  await requireAdmin();
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const key = parseReportKey(params.relatorio);
  const report = await getReport(key, {
    period: parsePeriod(params),
    q: params.q?.trim().slice(0, 100) || undefined,
  });
  const day = new Date(Date.now() - 4 * 3600_000).toISOString().slice(0, 10);
  return new Response(reportToCsv(report), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-${key}-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
