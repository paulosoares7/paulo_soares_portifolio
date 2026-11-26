import type { Metadata } from "next";
import Link from "next/link";
import { Download, Eye, EyeOff, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { prisma, type Prisma } from "@portfolio/database";
import { deletePublication, togglePublication } from "@/actions/publications";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { PUBLICATION_SOURCES, PUBLICATION_TYPES } from "@/lib/labels";

export const metadata: Metadata = { title: "Publicações" };

type SearchParams = Promise<{ q?: string; tipo?: string; ano?: string }>;

/** Lista de publicações com busca e filtros (RF24). */
export default async function PublicationsPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = "", tipo = "", ano = "" } = await searchParams;
  const where: Prisma.PublicationWhereInput = {};
  if (q.trim()) where.title = { contains: q.trim() };
  if (tipo in PUBLICATION_TYPES) where.type = tipo as keyof typeof PUBLICATION_TYPES;
  if (/^\d{4}$/.test(ano)) where.year = Number(ano);

  const [publications, years] = await Promise.all([
    prisma.publication.findMany({
      where,
      orderBy: [{ year: "desc" }, { title: "asc" }],
      take: 500,
    }),
    prisma.publication.findMany({
      distinct: ["year"],
      select: { year: true },
      orderBy: { year: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Publicações"
        description="Cadastre à mão ou importe do Lattes e do ORCID (sempre com prévia)."
        actions={
          <>
            <ButtonLink href="/publicacoes/importar" variant="secondary">
              <Download className="size-4" aria-hidden /> Importar
            </ButtonLink>
            <ButtonLink href="/publicacoes/nova">
              <Plus className="size-4" aria-hidden /> Nova publicação
            </ButtonLink>
          </>
        }
      />

      <form className="mb-4 flex flex-wrap items-end gap-3" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por título"
          aria-label="Buscar por título"
          className="max-w-xs"
        />
        <Select name="tipo" defaultValue={tipo} aria-label="Filtrar por tipo" className="max-w-56">
          <option value="">Todos os tipos</option>
          {Object.entries(PUBLICATION_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select name="ano" defaultValue={ano} aria-label="Filtrar por ano" className="max-w-32">
          <option value="">Todos os anos</option>
          {years.map(({ year }) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonClasses("secondary")}>
          Filtrar
        </button>
        {q || tipo || ano ? (
          <Link href="/publicacoes" className="text-muted hover:text-accent text-sm">
            Limpar
          </Link>
        ) : null}
      </form>

      {publications.length === 0 ? (
        <EmptyState>Nenhuma publicação encontrada.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Ano</Th>
              <Th>Publicação</Th>
              <Th>Origem</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {publications.map((p) => (
              <tr key={p.id} className={p.isVisible ? "" : "opacity-60"}>
                <Td className="text-muted">{p.year}</Td>
                <Td>
                  <p className="font-medium">{p.title}</p>
                  <p className="text-muted text-xs">
                    {PUBLICATION_TYPES[p.type]} · {p.authors}
                    {p.venue ? ` · ${p.venue}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.isFeatured ? <Badge tone="warning">destaque</Badge> : null}
                    {p.isVisible ? null : <Badge>oculta</Badge>}
                    {p.doi ? <Badge tone="accent">DOI {p.doi}</Badge> : null}
                  </div>
                </Td>
                <Td>
                  <Badge>{PUBLICATION_SOURCES[p.source]}</Badge>
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    <ActionButton
                      action={togglePublication.bind(null, p.id, "isFeatured", !p.isFeatured)}
                      title={p.isFeatured ? "Tirar do destaque" : "Destacar na home"}
                    >
                      <Star
                        className={`size-4 ${p.isFeatured ? "fill-warning text-warning" : ""}`}
                        aria-hidden
                      />
                    </ActionButton>
                    <ActionButton
                      action={togglePublication.bind(null, p.id, "isVisible", !p.isVisible)}
                      title={p.isVisible ? "Ocultar no site" : "Mostrar no site"}
                    >
                      {p.isVisible ? (
                        <Eye className="size-4" aria-hidden />
                      ) : (
                        <EyeOff className="size-4" aria-hidden />
                      )}
                    </ActionButton>
                    <ButtonLink
                      href={`/publicacoes/${p.id}`}
                      variant="ghost"
                      size="sm"
                      aria-label={`Editar ${p.title}`}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </ButtonLink>
                    <ActionButton
                      action={deletePublication.bind(null, p.id)}
                      confirm="Remover esta publicação?"
                      title="Remover"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </ActionButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
