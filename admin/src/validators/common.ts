// Peças de schema reutilizadas pelos validadores (cliente e servidor).
import { z } from "zod";
import { isHttpsUrl, normalizeExternalUrl } from "@portfolio/database/external-link";
import { parseMoneyToCents } from "@/lib/format";

/** Checkbox HTML: "on" quando marcado, ausente quando não. */
export const checkbox = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

/**
 * Texto obrigatório, sem espaços nas pontas.
 * @param max Tamanho máximo da coluna.
 */
export const requiredText = (max: number) =>
  z
    .string({ error: "Campo obrigatório." })
    .trim()
    .min(1, "Campo obrigatório.")
    .max(max, `Máximo de ${max} caracteres.`);

/**
 * Texto opcional: vazio vira null (coluna NULL no banco).
 * @param max Tamanho máximo da coluna.
 */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres.`)
    .optional()
    .transform((value) => (value ? value : null));

/**
 * URL opcional (http/https); vazio vira null.
 * @param max Tamanho máximo da coluna.
 */
export const optionalUrl = (max: number) =>
  optionalText(max).refine((value) => value === null || /^https?:\/\/\S+$/i.test(value), {
    message: "Informe uma URL começando com http:// ou https://.",
  });

/**
 * Link externo opcional (Drive, OneDrive, Dropbox ou site): só https. Link do
 * Google Drive é salvo no formato de visualização (…/file/d/ID/view).
 * @param max Tamanho máximo.
 */
export const optionalHttpsLink = (max: number) =>
  optionalText(max)
    .refine((value) => value === null || isHttpsUrl(value), {
      message: "Informe um endereço completo começando com https://.",
    })
    .transform((value) => (value === null ? null : normalizeExternalUrl(value)));

/** E-mail obrigatório, em minúsculas. */
export const email = z
  .string({ error: "Campo obrigatório." })
  .trim()
  .toLowerCase()
  .min(1, "Campo obrigatório.")
  .pipe(z.email("E-mail inválido.").max(190, "Máximo de 190 caracteres."));

/** ID numérico vindo de campo oculto ou select (select sem escolha não é enviado). */
export const id = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number({ error: "Selecione uma opção." }).int().positive("Selecione uma opção."),
);

/** ID opcional: vazio vira null. */
export const optionalId = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.coerce.number().int().positive().nullable(),
);

/**
 * Inteiro opcional: vazio vira null.
 * @param min Valor mínimo.
 * @param max Valor máximo.
 */
export const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    z.coerce
      .number({ error: "Número inválido." })
      .int("Use um número inteiro.")
      .min(min, `Mínimo ${min}.`)
      .max(max, `Máximo ${max}.`)
      .nullable(),
  );

/** Slug de URL: letras minúsculas, números e hífens. */
export const slug = z
  .string({ error: "Campo obrigatório." })
  .trim()
  .min(1, "Campo obrigatório.")
  .max(120, "Máximo de 120 caracteres.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use só letras minúsculas, números e hífens (ex.: fisica-1).",
  );

/** Valor em reais digitado ("19,90") convertido para centavos. */
export const moneyCents = z.string({ error: "Campo obrigatório." }).transform((value, ctx) => {
  const cents = parseMoneyToCents(value);
  if (cents === null) {
    ctx.addIssue({ code: "custom", message: "Use o formato 19,90." });
    return z.NEVER;
  }
  return cents;
});

/** Data AAAA-MM-DD opcional (input type="date"), em UTC. */
export const optionalDate = z.preprocess(
  (value) => (value === "" || value == null ? null : value),
  z.iso
    .date("Data inválida.")
    .transform((value) => new Date(`${value}T00:00:00.000Z`))
    .nullable(),
);

/**
 * Gera um slug a partir de um título ("Física I" → "fisica-i").
 * @param text Texto de origem.
 * @returns Slug sugerido.
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
