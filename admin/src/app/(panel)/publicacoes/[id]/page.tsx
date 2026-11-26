import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@portfolio/database";
import { PublicationForm } from "@/components/forms/PublicationForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { PUBLICATION_SOURCES } from "@/lib/labels";

export const metadata: Metadata = { title: "Editar publicação" };

/** Edição de uma publicação. */
export default async function EditPublicationPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const p = await prisma.publication.findUnique({ where: { id } });
  if (!p) notFound();

  return (
    <>
      <PageHeader
        title="Editar publicação"
        back={{ href: "/publicacoes", label: "Publicações" }}
        description={
          p.source !== "manual" ? (
            <>
              Origem: <Badge tone="accent">{PUBLICATION_SOURCES[p.source]}</Badge> — uma nova
              importação pode sugerir alterações sobre o que você editar aqui.
            </>
          ) : undefined
        }
      />
      <Card>
        <PublicationForm
          item={{
            id: p.id,
            type: p.type,
            title: p.title,
            authors: p.authors,
            venue: p.venue ?? "",
            year: String(p.year),
            volume: p.volume ?? "",
            issue: p.issue ?? "",
            pages: p.pages ?? "",
            doi: p.doi ?? "",
            url: p.url ?? "",
            abstract: p.abstract ?? "",
            keywords: p.keywords ?? "",
            isFeatured: p.isFeatured,
            isVisible: p.isVisible,
          }}
        />
      </Card>
    </>
  );
}
