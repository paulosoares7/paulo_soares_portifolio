import type { ReactNode } from "react";

/** Item da linha do tempo (formação ou atuação). */
export type TimelineItem = {
  id: number;
  period: string;
  title: string;
  subtitle: string;
  detail?: ReactNode;
};

/** Linha do tempo vertical com marcadores em ciano. */
export function Timeline({ items, empty }: { items: TimelineItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-muted text-sm">{empty}</p>;
  return (
    <ol className="border-border relative ml-2 border-l">
      {items.map((item) => (
        <li key={item.id} className="relative pb-8 pl-6 last:pb-0">
          <span
            aria-hidden
            className="border-accent bg-bg absolute top-1.5 -left-[7px] size-3.5 rounded-full border-2"
          />
          <p className="text-accent text-xs font-medium tracking-wide uppercase">{item.period}</p>
          <h3 className="mt-1 font-semibold">{item.title}</h3>
          <p className="text-muted text-sm">{item.subtitle}</p>
          {item.detail ? <div className="text-muted mt-2 text-sm">{item.detail}</div> : null}
        </li>
      ))}
    </ol>
  );
}
