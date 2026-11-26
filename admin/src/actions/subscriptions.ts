"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { fetchSubscriptionPayments, isAsaasConfigured } from "@/lib/asaas";
import { requireAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import type { ActionState } from "@/types/action";
import { courtesySchema, extendSchema, planSchema } from "@/validators/subscription";

/** Atualiza as telas de assinaturas, alunos e o resumo. */
function revalidateSubscriptions(): void {
  revalidatePath("/assinaturas");
  revalidatePath("/alunos", "layout");
  revalidatePath("/");
}

/** Cria ou edita um plano. Mudar o preço não altera assinaturas existentes. */
export async function savePlan(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(planSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.plan.update({ where: { id }, data });
    else await prisma.plan.create({ data });
  } catch (error) {
    return actionError(error);
  }
  revalidateSubscriptions();
  return { ok: true, message: "Plano salvo." };
}

/**
 * Cria uma assinatura de cortesia (gateway = manual, preço 0) com as
 * disciplinas escolhidas nas vagas 1..3. Opcionalmente gera o código.
 */
export async function createCourtesy(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(courtesySchema, formData);
  if (!parsed.success) return parsed.state;
  const { studentId, name, displayName, email, planId, courseIds, periodEnd } = parsed.data;

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return { ok: false, fieldErrors: { planId: ["Plano não encontrado."] } };
  const uniqueCourses = [...new Set(courseIds)];
  if (uniqueCourses.length > plan.maxCourses) {
    return {
      ok: false,
      fieldErrors: { courseIds: [`Este plano tem ${plan.maxCourses} vaga(s).`] },
    };
  }

  // Aluno existente (escolhido ou pelo e-mail) ou novo.
  let targetId = studentId;
  if (!targetId && email) {
    targetId =
      (await prisma.student.findUnique({ where: { email }, select: { id: true } }))?.id ?? null;
  }
  if (targetId) {
    const current = await prisma.subscription.findFirst({
      where: {
        studentId: targetId,
        status: { in: ["active", "past_due", "canceled"] },
        currentPeriodEnd: { gt: new Date() },
      },
    });
    if (current) {
      return {
        ok: false,
        message: "Este aluno já tem uma assinatura vigente. Prorrogue ou encerre a atual antes.",
      };
    }
  }

  try {
    const now = new Date();
    const subscription = await prisma.$transaction(async (tx) => {
      const student =
        targetId !== null
          ? { id: targetId }
          : await tx.student.create({
              data: {
                name: name ?? "",
                displayName: displayName ?? (name ?? "").split(" ")[0] ?? "",
                email: email ?? "",
              },
            });
      return tx.subscription.create({
        data: {
          studentId: student.id,
          planId,
          status: "active",
          gateway: "manual",
          priceCents: 0,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          courses: {
            create: uniqueCourses.map((courseId, index) => ({ courseId, slotNumber: index + 1 })),
          },
        },
      });
    });

    revalidateSubscriptions();
    return { ok: true, message: `Cortesia criada (assinatura #${subscription.id}).` };
  } catch (error) {
    return actionError(error, "Não foi possível criar a cortesia.");
  }
}

/** Prorroga o fim de uma cortesia. */
export async function extendCourtesy(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(extendSchema, formData);
  if (!parsed.success) return parsed.state;
  const subscription = await prisma.subscription.findUnique({
    where: { id: parsed.data.subscriptionId },
  });
  if (!subscription || subscription.gateway !== "manual")
    return { ok: false, message: "Só cortesias podem ser prorrogadas aqui." };
  try {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { currentPeriodEnd: parsed.data.periodEnd, status: "active", canceledAt: null },
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateSubscriptions();
  return { ok: true, message: "Cortesia prorrogada." };
}

/** Encerra uma cortesia agora (acesso termina na hora). */
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
  return { ok: true };
}

/**
 * Espelha as cobranças de uma assinatura do Asaas na tabela payments
 * (consulta; não muda status nem acesso, que são regras do webhook no site).
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
