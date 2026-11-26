import type { Report } from "@/lib/reports";

/**
 * Tabela do relatório. `print` usa cores claras para papel/PDF.
 * @param report Relatório montado.
 * @param print Versão para impressão.
 */
export function ReportTable({ report, print = false }: { report: Report; print?: boolean }) {
  if (!report.rows.length) {
    return (
      <p className={`py-10 text-center text-sm ${print ? "text-gray-600" : "text-muted"}`}>
        Nada encontrado com estes filtros.
      </p>
    );
  }
  const head = print
    ? "border-gray-300 bg-gray-100 text-gray-700"
    : "border-border bg-surface text-muted";
  const cellBorder = print ? "border-gray-200" : "border-border/60";
  return (
    <div className={print ? "" : "rounded-card border-border overflow-x-auto border"}>
      <table className={`w-full text-left ${print ? "text-xs" : "min-w-[720px] text-sm"}`}>
        <thead>
          <tr>
            {report.columns.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={`border-b px-3 py-2 font-medium ${head} ${report.numeric.includes(i) ? "text-right" : ""}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row, r) => (
            <tr key={r} className={print ? "break-inside-avoid" : "hover:bg-surface/60"}>
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={`border-b px-3 py-2 align-top ${cellBorder} ${report.numeric.includes(i) ? "text-right tabular-nums" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
