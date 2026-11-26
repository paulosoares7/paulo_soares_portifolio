// Regras de vagas e de cortesia usadas pelas ações do painel (RN07).
import type { Prisma } from "@portfolio/database";

/** Teto de vagas por assinatura (o banco recusa acima disso). */
export const MAX_SLOTS = 10;

/** Status em que a assinatura ainda dá acesso (até current_period_end). */
export const ACCESS_STATUSES = ["active", "past_due", "canceled"] as const;

/**
 * Vagas que valem para a assinatura: a exceção do aluno ou as do plano.
 * @param subscription Exceção da assinatura e vagas do plano.
 * @returns Número de vagas.
 */
export function effectiveMaxCourses(subscription: {
  maxCoursesOverride: number | null;
  plan: { maxCourses: number };
}): number {
  return subscription.maxCoursesOverride ?? subscription.plan.maxCourses;
}

/**
 * Fim do acesso de uma cortesia de N dias: fim do último dia no fuso de
 * Manaus (UTC−4, sem horário de verão). Hoje conta como o 1º dia.
 * @param days Dias de cortesia (1 ou mais).
 * @param from Início (padrão: agora).
 * @returns Data e hora em UTC.
 */
export function courtesyEnd(days: number, from = new Date()): Date {
  const manaus = new Date(from.getTime() - 4 * 60 * 60 * 1000);
  const day = manaus.toISOString().slice(0, 10);
  const end = new Date(`${day}T23:59:59.000-04:00`);
  end.setUTCDate(end.getUTCDate() + days - 1);
  return end;
}

/**
 * Grava as disciplinas das vagas. Disciplina que continua mantém a vaga
 * dela; as novas ocupam as vagas livres de menor número. Trocas agendadas
 * para vagas que mudaram são canceladas (o painel decidiu na hora).
 * @param tx Transação do Prisma.
 * @param subscriptionId Assinatura.
 * @param courseIds Disciplinas na ordem escolhida (sem repetição).
 */
export async function replaceSlots(
  tx: Prisma.TransactionClient,
  subscriptionId: number,
  courseIds: number[],
): Promise<void> {
  const current = await tx.subscriptionCourse.findMany({ where: { subscriptionId } });
  const kept = current.filter((slot) => courseIds.includes(slot.courseId));
  const used = new Set(kept.map((slot) => slot.slotNumber));
  const keptIds = new Set(kept.map((slot) => slot.courseId));
  const added: { slotNumber: number; courseId: number }[] = [];
  let next = 1;
  for (const courseId of courseIds.filter((id) => !keptIds.has(id))) {
    while (used.has(next)) next += 1;
    used.add(next);
    added.push({ slotNumber: next, courseId });
  }
  const removedSlots = current.filter((slot) => !keptIds.has(slot.courseId));

  await tx.subscriptionCourse.deleteMany({
    where: { subscriptionId, slotNumber: { in: removedSlots.map((slot) => slot.slotNumber) } },
  });
  if (added.length) {
    await tx.subscriptionCourse.createMany({
      data: added.map((slot) => ({ subscriptionId, ...slot })),
    });
  }
  const changedSlots = [
    ...removedSlots.map((s) => s.slotNumber),
    ...added.map((s) => s.slotNumber),
  ];
  if (changedSlots.length) {
    await tx.subscriptionCourseChange.updateMany({
      where: { subscriptionId, status: "scheduled", slotNumber: { in: changedSlots } },
      data: { status: "canceled" },
    });
  }
}

/**
 * Renovação: tira as vagas acima do limite (as de número maior), quando o
 * limite foi reduzido. Usada ao prorrogar a cortesia; a renovação paga (fase 4,
 * webhook do Asaas) deve chamar a mesma regra.
 * @param tx Transação do Prisma.
 * @param subscriptionId Assinatura.
 * @param limit Vagas que valem agora.
 * @returns Quantas vagas saíram.
 */
export async function trimExtraSlots(
  tx: Prisma.TransactionClient,
  subscriptionId: number,
  limit: number,
): Promise<number> {
  const slots = await tx.subscriptionCourse.findMany({
    where: { subscriptionId },
    orderBy: { slotNumber: "asc" },
  });
  const extra = slots.slice(limit).map((slot) => slot.slotNumber);
  if (!extra.length) return 0;
  await tx.subscriptionCourse.deleteMany({ where: { subscriptionId, slotNumber: { in: extra } } });
  return extra.length;
}
