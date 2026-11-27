// Endereços de um material para a página (RN12 + materiais por link).
// Regra de acesso: nada sai do servidor para quem não tem acesso (lib/access.ts
// decide o "locked"). Arquivo enviado nunca vira link direto: abre no
// visualizador com marca d'água (fase 4). Link externo abre como está e, se for
// do Google Drive/Docs, também embutido na página.
import { embedUrl } from "@portfolio/database/external-link";
import type { Access } from "@/lib/access";

/** Como o material chega à página. */
export type MaterialLinks = {
  kind: "file" | "link";
  /** Link para abrir em nova aba (só material por link, só com acesso). */
  openUrl: string | null;
  /** Endereço para embutir na página (Drive/Docs), só com acesso. */
  embedUrl: string | null;
};

/**
 * Decide o que a página recebe de um material.
 * @param material fileId e externalUrl do banco.
 * @param access Resultado de lib/access.ts para este material.
 * @returns Forma do material e os endereços liberados.
 */
export function materialLinks(
  material: { fileId: number | null; externalUrl: string | null },
  access: Access,
): MaterialLinks {
  if (material.fileId !== null || !material.externalUrl) {
    return { kind: "file", openUrl: null, embedUrl: null };
  }
  if (access === "locked") return { kind: "link", openUrl: null, embedUrl: null };
  return {
    kind: "link",
    openUrl: material.externalUrl,
    embedUrl: embedUrl(material.externalUrl),
  };
}
