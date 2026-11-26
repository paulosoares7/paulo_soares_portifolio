import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { PublicationCard } from "@/components/publications/PublicationCard";
import { buttonClasses } from "@/components/ui/Button";
import { Container, PageTitle } from "@/components/ui/Container";
import { plural } from "@/lib/format";
import { PUBLICATION_TYPES } from "@/lib/labels";
import { getPublications } from "@/lib/portfolio";

export const metadata: Metadata = {
  title: "Publicações",
  description: "Artigos, trabalhos em eventos, livros e capítulos, com DOI.",
};

const field =
  "h-11 rounded-btn border border-border bg-surface px-3 text-sm text-text focus:border-accent focus:outline-none";

type SearchParams = Promise<{ q?: string; tipo?: string; ano?: string }>;

/** Publicações (RF03): filtro por tipo e ano, busca por título, DOI e destaques. */
export default async function PublicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", tipo = "", ano = "" } = await searchParams;
  const { publications, years, types } = await getPublications({ q, type: tipo, year: ano });
  const filtering = Boolean(q || tipo || ano);
  // Sem filtro, os destaques sobem para o topo.
  const ordered = filtering
    ? publications
    : [...publications].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

  return (
    <Container>
      <PageTitle
        title="Publicações"
        description="Produção acadêmica importada do Lattes e do ORCID ou cadastrada no painel."
      />

      <form
        role="search"
        className="rounded-card border-border bg-surface-2 mb-8 flex flex-col gap-3 border p-4 sm:flex-row sm:flex-wrap sm:items-center"
      >
        <label className="relative flex-1 sm:min-w-64">
          <span className="sr-only">Buscar por título</span>
          <Search
            className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por título"
            className={`${field} w-full pl-9`}
          />
        </label>
        <label>
          <span className="sr-only">Tipo</span>
          <select name="tipo" defaultValue={tipo} className={`${field} w-full sm:w-52`}>
            <option value="">Todos os tipos</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {PUBLICATION_TYPES[type]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Ano</span>
          <select name="ano" defaultValue={ano} className={`${field} w-full sm:w-36`}>
            <option value="">Todos os anos</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={buttonClasses("primary")}>
          Filtrar
        </button>
        {filtering ? (
          <Link href="/publicacoes" className="text-muted hover:text-accent text-sm">
            Limpar filtros
          </Link>
        ) : null}
      </form>

      <p className="text-muted mb-4 text-sm" aria-live="polite">
        {plural(ordered.length, "publicação encontrada", "publicações encontradas")}
      </p>
      {ordered.length === 0 ? (
        <p className="rounded-card border-border text-muted border border-dashed px-4 py-12 text-center">
          Nenhuma publicação com esses filtros.
        </p>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2">
          {ordered.map((p) => (
            <li key={p.id}>
              <PublicationCard publication={p} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
