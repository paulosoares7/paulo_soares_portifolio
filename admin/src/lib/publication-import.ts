// Regra da importação (RN15): mostrar o que é novo e o que mudou, e apontar
// duplicatas entre Lattes e ORCID pelo DOI. Nada é gravado aqui.
import { prisma } from "@portfolio/database";
import type { PreviewItem } from "@/types/publication";
import type { ImportItem } from "@/validators/publication";
import { normalizeDoi } from "@/validators/publication";

const COMPARED_FIELDS: { key: keyof ImportItem; label: string }[] = [
  { key: "type", label: "tipo" },
  { key: "title", label: "título" },
  { key: "authors", label: "autores" },
  { key: "venue", label: "periódico/evento" },
  { key: "year", label: "ano" },
  { key: "volume", label: "volume" },
  { key: "issue", label: "número" },
  { key: "pages", label: "páginas" },
  { key: "doi", label: "DOI" },
  { key: "url", label: "link" },
  { key: "keywords", label: "palavras-chave" },
];

/**
 * Compara as publicações da fonte com o banco.
 * @param source Origem (lattes ou orcid).
 * @param items Publicações lidas da fonte.
 * @returns Itens com status (novo, alterado, igual) e possível duplicata por DOI.
 */
export async function buildImportPreview(
  source: "lattes" | "orcid",
  items: ImportItem[],
): Promise<PreviewItem[]> {
  const [sameSource, withDoi] = await Promise.all([
    prisma.publication.findMany({
      where: { source, externalId: { in: items.map((i) => i.externalId) } },
    }),
    prisma.publication.findMany({
      where: { source: { not: source }, doi: { not: null } },
      select: { id: true, title: true, source: true, doi: true },
    }),
  ]);
  const byExternalId = new Map(sameSource.map((p) => [p.externalId, p]));
  const byDoi = new Map(withDoi.map((p) => [normalizeDoi(p.doi), p]));

  return items.map((item) => {
    const existing = byExternalId.get(item.externalId);
    const doiMatch = item.doi ? byDoi.get(item.doi) : undefined;
    const duplicate = doiMatch
      ? { id: doiMatch.id, title: doiMatch.title, source: doiMatch.source }
      : null;

    if (!existing) return { item, status: "new", changes: [], duplicate };

    const changes = COMPARED_FIELDS.filter(({ key }) => {
      const current = key === "doi" ? normalizeDoi(existing.doi) : existing[key];
      return (current ?? null) !== (item[key] ?? null);
    }).map(({ label }) => label);

    return { item, status: changes.length ? "changed" : "unchanged", changes, duplicate };
  });
}
