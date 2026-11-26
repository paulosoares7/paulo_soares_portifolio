import { z } from "zod";
import { enumValues, PUBLICATION_TYPES } from "@/lib/labels";
import { checkbox, optionalId, optionalText, optionalUrl, requiredText } from "@/validators/common";

const currentYear = new Date().getUTCFullYear();

/** Normaliza DOI: sem prefixo de URL, minúsculo (para comparar duplicatas). */
export function normalizeDoi(value: string | null | undefined): string | null {
  if (!value) return null;
  const doi = value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .toLowerCase();
  return doi || null;
}

const doiField = optionalText(150).transform((value) => normalizeDoi(value));

/** Formulário de publicação (cadastro manual ou edição). */
export const publicationSchema = z.object({
  id: optionalId,
  type: z.enum(enumValues(PUBLICATION_TYPES), { error: "Escolha o tipo." }),
  title: requiredText(500),
  authors: requiredText(1000),
  venue: optionalText(300),
  year: z.coerce
    .number({ error: "Informe o ano." })
    .int()
    .min(1900, "Ano inválido.")
    .max(currentYear + 1, "Ano inválido."),
  volume: optionalText(20),
  issue: optionalText(20),
  pages: optionalText(30),
  doi: doiField,
  url: optionalUrl(500),
  abstract: optionalText(60000),
  keywords: optionalText(500),
  isFeatured: checkbox,
  isVisible: checkbox,
});

/** Item vindo da prévia de importação (JSON, não FormData). */
export const importItemSchema = z.object({
  externalId: z.string().trim().min(1).max(100),
  type: z.enum(enumValues(PUBLICATION_TYPES)),
  title: z.string().trim().min(1).max(500),
  authors: z.string().trim().min(1).max(1000),
  venue: z.string().trim().max(300).nullable(),
  year: z
    .number()
    .int()
    .min(1900)
    .max(currentYear + 1),
  volume: z.string().trim().max(20).nullable(),
  issue: z.string().trim().max(20).nullable(),
  pages: z.string().trim().max(30).nullable(),
  doi: z.string().trim().max(150).nullable(),
  url: z.string().trim().max(500).nullable(),
  keywords: z.string().trim().max(500).nullable(),
});

/** Pedido de gravação depois da prévia. */
export const applyImportSchema = z.object({
  source: z.enum(["lattes", "orcid"]),
  fileName: z.string().max(255).nullable(),
  totalInPreview: z.number().int().min(0),
  lattesUpdatedAt: z.iso.date().nullable(),
  items: z.array(importItemSchema).max(2000),
});

/** Publicação normalizada vinda do Lattes ou do ORCID. */
export type ImportItem = z.infer<typeof importItemSchema>;
