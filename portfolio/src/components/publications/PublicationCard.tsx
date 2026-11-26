import { ExternalLink, Star } from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import { PUBLICATION_TYPES } from "@/lib/labels";
import { doiUrl } from "@/lib/portfolio";

type Publication = {
  id: number;
  type: keyof typeof PUBLICATION_TYPES;
  title: string;
  authors: string;
  venue: string | null;
  year: number;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  doi: string | null;
  url: string | null;
  isFeatured: boolean;
};

/** Referência no estilo Lattes: autores, título, veículo, volume, páginas e ano. */
function citation(p: Publication): string {
  const parts = [
    p.venue,
    p.volume ? `v. ${p.volume}` : null,
    p.issue ? `n. ${p.issue}` : null,
    p.pages ? `p. ${p.pages}` : null,
    String(p.year),
  ];
  return parts.filter(Boolean).join(", ");
}

/** Cartão de publicação com selo do tipo, destaque e links de DOI e acesso. */
export function PublicationCard({ publication: p }: { publication: Publication }) {
  return (
    <article className="rounded-card border-border bg-surface hover:border-accent/60 flex h-full flex-col gap-3 border p-5 transition-colors">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">{PUBLICATION_TYPES[p.type]}</Badge>
        <span className="text-muted text-xs">{p.year}</span>
        {p.isFeatured ? (
          <Badge tone="warning">
            <Star className="fill-warning size-3" aria-hidden /> Destaque
          </Badge>
        ) : null}
      </div>
      <h3 className="leading-snug font-semibold">{p.title}</h3>
      <p className="text-muted text-sm">{p.authors}</p>
      <p className="text-muted text-sm italic">{citation(p)}</p>
      <div className="mt-auto flex flex-wrap gap-4 pt-2 text-sm">
        {p.doi ? (
          <a
            href={doiUrl(p.doi)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent inline-flex items-center gap-1 hover:underline"
          >
            DOI {p.doi} <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
        {p.url && !p.doi ? (
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent inline-flex items-center gap-1 hover:underline"
          >
            Acessar <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
      </div>
    </article>
  );
}
