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
  optionalInt,
} from "@/validators/common";

/** Teto de vagas (igual ao CHECK do banco e a lib/subscription-rules.ts). */
const MAX_SLOTS = 10;

/** Disciplinas marcadas (nenhuma caixa marcada = campo ausente no FormData). */
const courseIdList = z.preprocess(
  (v) => v ?? [],
  z.array(z.coerce.number().int().positive()).max(MAX_SLOTS, `No máximo ${MAX_SLOTS} disciplinas.`),
);

/** Dias de cortesia (hoje conta como o 1º dia). */
const courtesyDays = z.coerce
  .number({ error: "Informe os dias." })
  .int("Use um número inteiro.")
  .min(1, "Mínimo 1 dia.")
  .max(3650, "Máximo 3650 dias.");

/** Plano à venda (preço em reais no formulário, centavos no banco). */
export const planSchema = z.object({
  id: optionalId,
  name: requiredText(120),
  description: optionalText(400),
  priceCents: moneyCents,
  billingCycle: z.enum(enumValues(BILLING_CYCLES)),
  maxCourses: z.coerce.number().int().min(1, "Mínimo 1.").max(MAX_SLOTS, `Máximo ${MAX_SLOTS}.`),
  isActive: checkbox,
});

// "Acesso até 30/06" = até o fim do dia 30/06 no fuso de Manaus (UTC−4, sem horário de verão).
const futureDate = z.iso
  .date("Data inválida.")
  .transform((value) => new Date(`${value}T23:59:59.000-04:00`))
  .refine((date) => date > new Date(), "A data precisa ser no futuro.");

/** Ligar a cortesia de um aluno já cadastrado (gateway = manual). */
export const courtesySchema = z.object({
  studentId: id,
  planId: id,
  days: courtesyDays,
  courseIds: courseIdList.refine((ids) => ids.length > 0, "Escolha pelo menos uma disciplina."),
});

/** Novo aluno pelo painel, com cortesia e convite opcionais. */
export const newStudentSchema = z
  .object({
    name: requiredText(150),
    displayName: optionalText(60),
    email,
    sendInvite: checkbox,
    courtesy: checkbox,
    planId: optionalId,
    days: z.preprocess((v) => (v === "" ? undefined : v), courtesyDays.optional()),
    courseIds: courseIdList,
  })
  .superRefine((value, ctx) => {
    if (!value.courtesy) return;
    if (!value.planId)
      ctx.addIssue({ code: "custom", path: ["planId"], message: "Escolha o plano." });
    if (!value.days) ctx.addIssue({ code: "custom", path: ["days"], message: "Informe os dias." });
    if (!value.courseIds.length)
      ctx.addIssue({
        code: "custom",
        path: ["courseIds"],
        message: "Escolha pelo menos uma disciplina.",
      });
  });

/**
 * Edição da assinatura no painel (lápis). Status e "acesso até" só valem para
 * cortesia; numa assinatura do Asaas quem manda é o Asaas.
 */
export const subscriptionEditSchema = z.object({
  id,
  planId: id,
  maxCoursesOverride: optionalInt(1, MAX_SLOTS),
  courseIds: courseIdList,
  status: z.enum(["active", "canceled", "expired"]).optional(),
  periodEnd: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.iso
      .date("Data inválida.")
      .transform((value) => new Date(`${value}T23:59:59.000-04:00`))
      .optional(),
  ),
});

/** Excluir aluno: precisa digitar o e-mail dele para confirmar. */
export const deleteStudentSchema = z.object({
  id,
  confirmEmail: z.string().trim().toLowerCase().min(1, "Digite o e-mail do aluno."),
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
