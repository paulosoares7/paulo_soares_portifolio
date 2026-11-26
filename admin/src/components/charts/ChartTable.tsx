/**
 * Tabela com os números do gráfico, recolhida em "Ver tabela" (acessível a
 * leitores de tela e útil para conferir valores).
 * @param columns Cabeçalhos.
 * @param rows Linhas já formatadas.
 */
export function ChartTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  if (!rows.length) return null;
  return (
    <details className="text-xs">
      <summary className="text-muted hover:text-text w-fit cursor-pointer">Ver tabela</summary>
      <div className="mt-2 max-h-60 overflow-auto">
        <table className="w-full text-left">
          <thead className="text-muted">
            <tr>
              {columns.map((c, i) => (
                <th key={c} className={`py-1 pr-3 font-medium ${i ? "text-right" : ""}`}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-border border-t">
                {row.map((cell, i) => (
                  <td key={i} className={`py-1 pr-3 ${i ? "text-right tabular-nums" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
