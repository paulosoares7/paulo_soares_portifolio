import { z } from "zod";
import {
  DIFFICULTIES,
  enumValues,
  QUESTION_TYPES,
  SHOW_ANSWERS,
  CONTENT_STATUSES,
} from "@/lib/labels";
import {
  checkbox,
  id,
  optionalId,
  optionalInt,
  optionalText,
  requiredText,
} from "@/validators/common";

/**
 * Número decimal digitado ("1,5" ou "1.5"), com limites da coluna DECIMAL.
 * @param max Maior valor aceito.
 * @param decimals Casas decimais da coluna.
 */
const decimal = (max: number, decimals: number) =>
  z
    .string()
    .trim()
    .transform((value, ctx) => {
      const normalized = value.replace(",", ".");
      const parsed = Number(normalized);
      const parts = normalized.split(".");
      if (!value || Number.isNaN(parsed) || (parts[1]?.length ?? 0) > decimals) {
        ctx.addIssue({ code: "custom", message: `Número com até ${decimals} casas decimais.` });
        return z.NEVER;
      }
      if (Math.abs(parsed) > max) {
        ctx.addIssue({ code: "custom", message: `Máximo ${max}.` });
        return z.NEVER;
      }
      return parsed;
    });

const optionalDecimal = (max: number, decimals: number) =>
  z
    .preprocess(
      (value) => (value === "" || value == null ? undefined : value),
      decimal(max, decimals).optional(),
    )
    .transform((v) => v ?? null);

/** Atividade de um módulo. */
export const activitySchema = z.object({
  id: optionalId,
  moduleId: id,
  title: requiredText(200),
  instructions: optionalText(60000),
  difficulty: z.enum(enumValues(DIFFICULTIES)),
  maxAttempts: optionalInt(1, 255),
  showAnswers: z.enum(enumValues(SHOW_ANSWERS)),
  isPreview: checkbox,
  status: z.enum(enumValues(CONTENT_STATUSES)),
});

/** Alternativa de múltipla escolha (id vazio = nova). */
export const optionSchema = z.object({
  id: z.number().int().positive().nullable(),
  text: z.string().trim().min(1, "Escreva a alternativa.").max(1000),
  isCorrect: z.boolean(),
  feedback: z
    .string()
    .trim()
    .max(500)
    .transform((v) => v || null),
});

/** Questão com gabarito conforme o tipo. As alternativas chegam em JSON. */
export const questionSchema = z
  .object({
    id: optionalId,
    activityId: id,
    type: z.enum(enumValues(QUESTION_TYPES)),
    statement: requiredText(60000),
    imageFileId: optionalId,
    points: decimal(999.99, 2).refine((v) => v > 0, "Pontos maiores que zero."),
    numericAnswer: optionalDecimal(9999999999.9999, 4),
    tolerancePct: optionalDecimal(100, 2).refine(
      (v) => v === null || v >= 0,
      "Tolerância não pode ser negativa.",
    ),
    unit: optionalText(20),
    explanation: optionalText(60000),
    options: z.preprocess(
      (value) => {
        if (typeof value !== "string") return value;
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return [];
        }
      },
      z.array(optionSchema).max(10, "No máximo 10 alternativas."),
    ),
  })
  .superRefine((q, ctx) => {
    if (q.type === "multiple_choice") {
      if (q.options.length < 2)
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Cadastre pelo menos 2 alternativas.",
        });
      if (!q.options.some((o) => o.isCorrect))
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Marque a alternativa correta.",
        });
    }
    if (q.type === "numeric" && q.numericAnswer === null) {
      ctx.addIssue({
        code: "custom",
        path: ["numericAnswer"],
        message: "Informe a resposta numérica (gabarito).",
      });
    }
  });

/** Correção manual de resposta aberta. */
export const gradeSchema = z.object({
  answerId: id,
  isCorrect: z
    .enum(["true", "false"], { error: "Escolha certo ou errado." })
    .transform((v) => v === "true"),
  pointsAwarded: decimal(999.99, 2).refine((v) => v >= 0, "Não pode ser negativo."),
});
