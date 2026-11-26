import type { ReactNode } from "react";

/** Aviso de lista vazia. */
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card border-border text-muted border border-dashed px-4 py-8 text-center text-sm">
      {children}
    </p>
  );
}
