import type { ReactNode } from "react";

/** Tabela com rolagem horizontal no celular. */
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border-border overflow-x-auto border">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

/** Cabeçalho da tabela. */
export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`border-border bg-surface text-muted border-b px-4 py-3 font-medium ${className}`}
    >
      {children}
    </th>
  );
}

/** Célula da tabela. */
export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <td className={`border-border/60 border-b px-4 py-3 align-top ${className}`}>{children}</td>
  );
}
