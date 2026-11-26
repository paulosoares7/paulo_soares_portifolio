import type { ReactNode } from "react";

/** Cartão de conteúdo (raio de 12 px). */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-card border-border bg-surface border p-5 ${className}`}>
      {children}
    </section>
  );
}

/** Título de seção dentro de um cartão. */
export function CardTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-text text-base font-semibold">{children}</h2>
      {actions}
    </div>
  );
}
