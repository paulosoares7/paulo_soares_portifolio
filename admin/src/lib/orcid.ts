// Leitura das publicações pela API pública do ORCID (dados públicos, sem login).
// Uso não comercial: só alimenta a vitrine de publicações (docs/01-decisoes.md).
import type { ImportItem } from "@/validators/publication";
import { normalizeDoi } from "@/validators/publication";

const API = "https://pub.orcid.org/v3.0";

type OrcidValue = { value?: string } | null | undefined;
type ExternalId = { "external-id-type"?: string; "external-id-value"?: string };
type WorkSummary = {
  "put-code": number;
  type?: string;
  title?: { title?: OrcidValue } | null;
  "journal-title"?: OrcidValue;
  "publication-date"?: { year?: OrcidValue } | null;
  "external-ids"?: { "external-id"?: ExternalId[] } | null;
  url?: OrcidValue;
};
type WorkDetail = WorkSummary & {
  contributors?: { contributor?: { "credit-name"?: OrcidValue }[] } | null;
  citation?: { "citation-type"?: string; "citation-value"?: string } | null;
};

// Tipos do ORCID → tipos da tabela publications.
const TYPE_MAP: Record<string, ImportItem["type"]> = {
  "journal-article": "journal_article",
  "conference-paper": "conference_paper",
  "conference-poster": "conference_paper",
  "conference-abstract": "abstract",
  book: "book",
  "edited-book": "book",
  "book-chapter": "book_chapter",
  "dissertation-thesis": "dissertation",
  report: "technical_report",
};

/** Valida o formato 0000-0000-0000-000X. */
export function isOrcidId(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(value);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (response.status === 404) throw new Error("ORCID iD não encontrado.");
  if (!response.ok) throw new Error(`O ORCID respondeu ${response.status}. Tente mais tarde.`);
  return (await response.json()) as T;
}

/**
 * Busca as publicações públicas de um ORCID iD.
 * Usa o resumo para a lista e o detalhe (em lotes de 100) para os autores.
 * @param orcidId iD no formato 0000-0000-0000-0000.
 * @param fallbackAuthor Nome usado quando o ORCID não informa os autores.
 * @returns Publicações normalizadas.
 */
export async function fetchOrcidWorks(
  orcidId: string,
  fallbackAuthor: string,
): Promise<ImportItem[]> {
  const works = await getJson<{ group?: { "work-summary"?: WorkSummary[] }[] }>(
    `/${orcidId}/works`,
  );
  // Cada grupo junta versões da mesma obra; a primeira é a preferida.
  const summaries = (works.group ?? [])
    .map((group) => group["work-summary"]?.[0])
    .filter((w): w is WorkSummary => !!w);

  const details = new Map<number, WorkDetail>();
  for (let i = 0; i < summaries.length; i += 100) {
    const codes = summaries
      .slice(i, i + 100)
      .map((w) => w["put-code"])
      .join(",");
    const bulk = await getJson<{ bulk?: { work?: WorkDetail }[] }>(`/${orcidId}/works/${codes}`);
    for (const entry of bulk.bulk ?? []) {
      if (entry.work) details.set(entry.work["put-code"], entry.work);
    }
  }

  const items: ImportItem[] = [];
  for (const summary of summaries) {
    const detail = details.get(summary["put-code"]) ?? summary;
    const title = summary.title?.title?.value?.trim();
    const year = Number(summary["publication-date"]?.year?.value);
    if (!title || !Number.isInteger(year) || year < 1900) continue;

    const names = ((detail as WorkDetail).contributors?.contributor ?? [])
      .map((c) => c["credit-name"]?.value?.trim())
      .filter(Boolean);
    const doi = summary["external-ids"]?.["external-id"]?.find(
      (id) => id["external-id-type"] === "doi",
    )?.["external-id-value"];

    items.push({
      externalId: String(summary["put-code"]),
      type: TYPE_MAP[summary.type ?? ""] ?? "other",
      title: title.slice(0, 500),
      authors: (names.length ? names.join("; ") : fallbackAuthor).slice(0, 1000),
      venue: summary["journal-title"]?.value?.trim().slice(0, 300) || null,
      year,
      volume: null,
      issue: null,
      pages: null,
      doi: normalizeDoi(doi),
      url: summary.url?.value?.trim().slice(0, 500) || null,
      keywords: null,
    });
  }
  return items;
}
