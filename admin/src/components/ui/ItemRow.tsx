import type { ReactNode } from "react";

/** Linha de lista: título, detalhe e ações à direita. */
export function ItemRow({
  title,
  detail,
  badges,
  actions,
}: {
  title: ReactNode;
  detail?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-text flex flex-wrap items-center gap-2 text-sm font-medium">
          {title}
          {badges}
        </p>
        {detail ? <p className="text-muted mt-0.5 text-xs">{detail}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  );
}
