import type { ImportItem } from "@/validators/publication";

/** Situação de um item na prévia da importação. */
export type PreviewStatus = "new" | "changed" | "unchanged";

/** Item da prévia: o que veio da fonte comparado ao que já está no banco. */
export type PreviewItem = {
  item: ImportItem;
  status: PreviewStatus;
  /** Campos que mudaram (rótulos em português), quando status = changed. */
  changes: string[];
  /** Publicação de outra origem com o mesmo DOI (provável duplicata). */
  duplicate: { id: number; title: string; source: string } | null;
};

/** Resposta da prévia para a tela de importação. */
export type PreviewResult =
  | {
      ok: true;
      source: "lattes" | "orcid";
      fileName: string | null;
      lattesUpdatedAt: string | null;
      sourceLabel: string;
      items: PreviewItem[];
    }
  | { ok: false; message: string };
