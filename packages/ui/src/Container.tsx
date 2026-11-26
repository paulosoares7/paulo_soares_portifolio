import type { ReactNode } from "react";

/** Largura máxima e respiro lateral padrão das páginas. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

/** Título de página com subtítulo opcional. */
export function PageTitle({
  title,
  accent,
  description,
}: {
  title: string;
  accent?: string;
  description?: ReactNode;
}) {
  return (
    <header className="mb-8 pt-10 sm:pt-14">
      <h1 className="text-3xl font-bold sm:text-4xl">
        {title} {accent ? <span className="text-accent">{accent}</span> : null}
      </h1>
      {description ? <p className="text-muted mt-3 max-w-2xl">{description}</p> : null}
    </header>
  );
}

/** Título de seção dentro da página. */
export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-2xl font-semibold">{children}</h2>
      {action}
    </div>
  );
}
