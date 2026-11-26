"use server";

import { revalidatePath } from "next/cache";
import { prisma, type Prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { fetchSubscriptionPayments, isAsaasConfigured } from "@/lib/asaas";
import { requireAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import { checkCourtesy, grantCourtesy } from "@/lib/courtesy";
import {
  ACCESS_STATUSES,
  effectiveMaxCourses,
  replaceSlots,
  trimExtraSlots,
} from "@/lib/subscription-rules";
import type { ActionState } from "@/types/action";
import {
  courtesySchema,
  extendSchema,
  planSchema,
  subscriptionEditSchema,
} from "@/validators/subscription";

/** Atualiza as telas de assinaturas, alunos e o resumo. */
function revalidateSubscriptions(): void {
  revalidatePath("/assinaturas");
  revalidatePath("/alunos", "layout");
  revalidatePath("/");
}

/**
 * Cria ou edita um plano. Mudar o preço não altera assinaturas existentes.
 * Reduzir as vagas não apaga disciplinas: a vaga a mais sai na renovação.
 */
export async function savePlan(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(planSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  let over = 0;
  try {
    if (id) {
      await prisma.plan.update({ where: { id }, data });
      // Assinaturas sem exceção própria que passaram do novo limite.
      const subscriptions = await prisma.subscription.findMany({
        where: { planId: id, maxCoursesOverride: null, status: { in: [...ACCESS_STATUSES] } },
        select: { _count: { select: { courses: true } } },
      });
      over = subscriptions.filter((s) => s._count.courses > data.maxCourses).length;
    } else await prisma.plan.create({ data });
  } catch (error) {
    return actionError(error);
  }
  revalidateSubscriptions();
  return {
    ok: true,
    message: over
      ? `Plano salvo. ${over} assinatura(s) têm mais disciplinas que o novo limite: as vagas a mais saem na renovação.`
      : "Plano salvo.",
  };
}

/** Liga a cortesia de um aluno cadastrado (botão de ligar e desligar). */
export async function createCourtesy(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(courtesySchema, formData);
  if (!parsed.success) return parsed.state;
  const input = { ...parsed.data, courseIds: [...new Set(parsed.data.courseIds)] };
  const problem = await checkCourtesy(input);
  if (problem) return problem;
  try {
    await prisma.$transaction((tx) => grantCourtesy(tx, input));
  } catch (error) {
    return actionError(error, "Não foi possível ligar a cortesia.");
  }
  revalidateSubscriptions();
  return { ok: true, message: `Cortesia ligada por ${input.days} dia(s).` };
}

/**
 * Prorroga o fim de uma cortesia. Prorrogar é a "renovação" da cortesia:
 * se o limite de vagas foi reduzido, as vagas a mais saem aqui.
 */
export async function extendCourtesy(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(extendSchema, formData);
  if (!parsed.success) return parsed.state;
  const subscription = await prisma.subscription.findUnique({
    where: { id: parsed.data.subscriptionId },
    include: { plan: { select: { maxCourses: true } } },
  });
  if (!subscription || subscription.gateway !== "manual")
    return { ok: false, message: "Só cortesias podem ser prorrogadas aqui." };
  let removed = 0;
  try {
    removed = await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { currentPeriodEnd: parsed.data.periodEnd, status: "active", canceledAt: null },
      });
      return trimExtraSlots(tx, subscription.id, effectiveMaxCourses(subscription));
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateSubscriptions();
  return {
    ok: true,
    message: removed
      ? `Cortesia prorrogada. ${removed} vaga(s) acima do limite saíram.`
      : "Cortesia prorrogada.",
  };
}

/** Desliga (encerra) uma cortesia agora: o acesso termina na hora. */
export async function endCourtesy(subscriptionId: number): Promise<ActionState> {
  await requireAdmin();
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription || subscription.gateway !== "manual")
    return { ok: false, message: "Só cortesias podem ser encerradas aqui." };
  const now = new Date();
  try {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: "expired", canceledAt: now, currentPeriodEnd: now },
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateSubscriptions();
  return { ok: true, message: "Cortesia desligada." };
}

/**
 * Edição da assinatura (lápis): plano, vagas do aluno, disciplinas nas vagas
 * e, só na cortesia, status e "acesso até". As cobranças não mudam aqui.
 * Com o limite reduzido, as disciplinas já escolhidas podem ficar (saem na
 * renovação), mas não dá para acrescentar outras acima do limite.
 */
export async function updateSubscription(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(subscriptionEditSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, planId, maxCoursesOverride, status, periodEnd } = parsed.data;
  const courseIds = [...new Set(parsed.data.courseIds)];

  const [subscription, plan] = await Promise.all([
    prisma.subscription.findUnique({
      where: { id },
      include: { courses: { select: { courseId: true } } },
    }),
    prisma.plan.findUnique({ where: { id: planId } }),
  ]);
  if (!subscription) return { ok: false, message: "Assinatura não encontrada." };
  if (!plan) return { ok: false, fieldErrors: { planId: ["Plano não encontrado."] } };

  const limit = maxCoursesOverride ?? plan.maxCourses;
  const currentIds = new Set(subscription.courses.map((c) => c.courseId));
  const added = courseIds.filter((courseId) => !currentIds.has(courseId));
  if (courseIds.length > limit && added.length > 0) {
    return {
      ok: false,
      fieldErrors: {
        courseIds: [
          `O limite é ${limit} vaga(s). Acima dele só ficam as disciplinas que já estavam (saem na renovação).`,
        ],
      },
    };
  }

  const isCourtesy = subscription.gateway === "manual";
  const now = new Date();
  // Status e fim do acesso: só na cortesia (na assinatura paga o Asaas decide).
  const courtesyData: Prisma.SubscriptionUpdateInput = {};
  if (isCourtesy && status) {
    courtesyData.status = status;
    if (status === "active") courtesyData.canceledAt = null;
    if (status === "canceled") courtesyData.canceledAt = subscription.canceledAt ?? now;
    if (status === "expired") {
      courtesyData.canceledAt = subscription.canceledAt ?? now;
      courtesyData.currentPeriodEnd = now;
    }
  }
  if (isCourtesy && periodEnd && status !== "expired") courtesyData.currentPeriodEnd = periodEnd;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id },
        data: { plan: { connect: { id: planId } }, maxCoursesOverride, ...courtesyData },
      });
      await replaceSlots(tx, id, courseIds);
    });
  } catch (error) {
    return actionError(error, "Não foi possível salvar a assinatura.");
  }
  revalidateSubscriptions();
  return {
    ok: true,
    message:
      courseIds.length > limit
        ? `Assinatura salva. ${courseIds.length - limit} disciplina(s) acima do limite saem na renovação.`
        : "Assinatura salva.",
  };
}

/**
 * Espelha as cobranças de uma assinatura do Asaas na tabela payments
 * (consulta; não muda status nem acesso, que são regras do webhook).
 */
export async function syncAsaasPayments(subscriptionId: number): Promise<ActionState> {
  await requireAdmin();
  if (!isAsaasConfigured()) return { ok: false, message: "Asaas não configurado (ASAAS_API_KEY)." };
  const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!subscription?.gatewaySubscriptionId || subscription.gateway !== "asaas") {
    return { ok: false, message: "Assinatura sem ID do Asaas." };
  }
  try {
    const payments = await fetchSubscriptionPayments(subscription.gatewaySubscriptionId);
    await prisma.$transaction(
      payments.map((p) =>
        prisma.payment.upsert({
          where: { gatewayPaymentId: p.gatewayPaymentId },
          create: { ...p, subscriptionId },
          update: p,
        }),
      ),
    );
  } catch (error) {
    return actionError(error, "Falha ao consultar o Asaas.");
  }
  revalidateSubscriptions();
  return { ok: true, message: "Cobranças atualizadas." };
}
