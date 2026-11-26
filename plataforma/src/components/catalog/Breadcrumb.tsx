import Link from "next/link";
import { ChevronRight } from "lucide-react";

/** Um passo do caminho; sem href é a página atual. */
export type Crumb = { label: string; href?: string };

/**
 * Caminho do catálogo (Aulas › Categoria › Grupo › Disciplina). Quebra a
 * linha no celular em vez de cortar o texto.
 * @param items Passos, do mais geral para a página atual.
 */
export function Breadcrumb({ items, className = "" }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Caminho" className={`text-muted text-sm ${className}`}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <ChevronRight className="size-4 shrink-0" aria-hidden /> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-accent">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-text">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
