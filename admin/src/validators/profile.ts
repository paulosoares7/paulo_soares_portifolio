import { z } from "zod";
import { DEGREE_LEVELS, DEGREE_STATUSES, enumValues, SOCIAL_NETWORKS } from "@/lib/labels";
import {
  email,
  optionalDate,
  optionalId,
  optionalInt,
  optionalText,
  optionalUrl,
  requiredText,
} from "@/validators/common";

/** Dados do perfil (linha única da tabela profile). */
export const profileSchema = z.object({
  fullName: requiredText(150),
  displayName: requiredText(80),
  headline: requiredText(150),
  shortBio: requiredText(400),
  longBio: optionalText(60000),
  publicEmail: z
    .preprocess((value) => (value === "" ? undefined : value), email.optional())
    .transform((v) => v ?? null),
  city: optionalText(100),
  lattesId: optionalText(20).refine(
    (v) => v === null || /^\d{1,20}$/.test(v),
    "Use só os números do currículo Lattes.",
  ),
  lattesUrl: optionalUrl(255),
  orcidId: optionalText(19).refine(
    (v) => v === null || /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(v),
    "Formato 0000-0000-0000-0000.",
  ),
  scholarUrl: optionalUrl(255),
});

/** Número de destaque da home (ex.: 10+ anos de docência). */
export const highlightSchema = z.object({
  id: optionalId,
  value: requiredText(20),
  label: requiredText(60),
});

/** Link de rede social. */
export const socialLinkSchema = z.object({
  id: optionalId,
  network: z.enum(enumValues(SOCIAL_NETWORKS), { error: "Escolha a rede." }),
  label: optionalText(60),
  url: requiredText(255).refine(
    (v) => /^(https?:\/\/|mailto:)\S+$/i.test(v),
    "Use https://... ou mailto:...",
  ),
  isVisible: z.preprocess((v) => v === "on" || v === true, z.boolean()),
});

/** Formação acadêmica. */
export const degreeSchema = z
  .object({
    id: optionalId,
    level: z.enum(enumValues(DEGREE_LEVELS), { error: "Escolha o nível." }),
    course: requiredText(200),
    institution: requiredText(200),
    startYear: optionalInt(1950, 2100),
    endYear: optionalInt(1950, 2100),
    status: z.enum(enumValues(DEGREE_STATUSES)),
    thesisTitle: optionalText(500),
    advisor: optionalText(150),
  })
  .refine((d) => d.startYear == null || d.endYear == null || d.endYear >= d.startYear, {
    path: ["endYear"],
    message: "O fim não pode ser antes do início.",
  });

/** Atuação profissional. */
export const experienceSchema = z
  .object({
    id: optionalId,
    institution: requiredText(200),
    role: requiredText(150),
    description: optionalText(60000),
    startDate: optionalDate,
    endDate: optionalDate,
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    path: ["endDate"],
    message: "O fim não pode ser antes do início.",
  });

/** Área ou linha de pesquisa. */
export const researchAreaSchema = z.object({
  id: optionalId,
  name: requiredText(150),
  description: optionalText(400),
});

/** Lista de IDs na nova ordem (arrastar para ordenar). */
export const reorderSchema = z.array(z.number().int().positive()).max(1000);
