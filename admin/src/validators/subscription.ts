import { z } from "zod";
import { BILLING_CYCLES, enumValues } from "@/lib/labels";
import {
  checkbox,
  email,
  id,
  optionalId,
  optionalText,
  requiredText,
  moneyCents,
} from "@/validators/common";

/** Plano à venda (preço em reais no formulário, centavos no banco). */
export const planSchema = z.object({
  id: optionalId,
  name: requiredText(120),
  description: optionalText(400),
  priceCents: moneyCents,
  billingCycle: z.enum(enumValues(BILLING_CYCLES)),
  maxCourses: z.coerce.number().int().min(1, "Mínimo 1.").max(3, "Máximo 3 (regra do banco)."),
  isActive: checkbox,
});

// "Acesso até 30/06" = até o fim do dia 30/06 no fuso de Manaus (UTC−4, sem horário de verão).
const futureDate = z.iso
  .date("Data inválida.")
  .transform((value) => new Date(`${value}T23:59:59.000-04:00`))
  .refine((date) => date > new Date(), "A data precisa ser no futuro.");

/** Assinatura de cortesia (gateway = manual). Aluno existente ou novo. */
export const courtesySchema = z
  .object({
    studentId: optionalId,
    name: optionalText(150),
    displayName: optionalText(60),
    email: z.preprocess((v) => (v === "" ? undefined : v), email.optional()),
    planId: id,
    // Nenhuma caixa marcada = campo ausente no FormData.
    courseIds: z.preprocess(
      (v) => v ?? [],
      z
        .array(z.coerce.number().int().positive())
        .min(1, "Escolha pelo menos uma disciplina.")
        .max(3, "No máximo 3 disciplinas."),
    ),
    periodEnd: futureDate,
    generateCode: checkbox,
  })
  .superRefine((value, ctx) => {
    if (!value.studentId) {
      if (!value.name)
        ctx.addIssue({ code: "custom", path: ["name"], message: "Informe o nome do aluno." });
      if (!value.email)
        ctx.addIssue({ code: "custom", path: ["email"], message: "Informe o e-mail do aluno." });
    }
  });

/** Prorrogar o fim de uma cortesia. */
export const extendSchema = z.object({ subscriptionId: id, periodEnd: futureDate });

/** Dados editáveis do aluno. */
export const studentSchema = z.object({
  id,
  name: requiredText(150),
  displayName: requiredText(60),
  email,
  isBlocked: checkbox,
});
