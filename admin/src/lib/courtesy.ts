// Cortesia = assinatura com gateway 'manual' (CLAUDE.md do admin). Funções do
// servidor usadas pelas ações de assinatura e de aluno; ficam fora de
// actions/ para não virarem server actions chamáveis pelo navegador.
import { prisma, type Prisma } from "@portfolio/database";
import { ACCESS_STATUSES, courtesyEnd } from "@/lib/subscription-rules";
import type { ActionState } from "@/types/action";

/**
 * Cria a assinatura de cortesia (gateway = manual, preço 0) com as
 * disciplinas nas vagas, valendo por N dias. Usada pela ação de ligar a
 * cortesia e pelo cadastro de aluno.
 * @param tx Transação do Prisma.
 * @param input Aluno, plano, dias e disciplinas (já validados).
 * @returns ID da assinatura criada.
 */
export async function grantCourtesy(
  tx: Prisma.TransactionClient,
  input: { studentId: number; planId: number; days: number; courseIds: number[] },
): Promise<number> {
  const now = new Date();
  const subscription = await tx.subscription.create({
    data: {
      studentId: input.studentId,
      planId: input.planId,
      status: "active",
      gateway: "manual",
      priceCents: 0,
      currentPeriodStart: now,
      currentPeriodEnd: courtesyEnd(input.days, now),
      courses: {
        create: input.courseIds.map((courseId, index) => ({ courseId, slotNumber: index + 1 })),
      },
    },
  });
  return subscription.id;
}

/**
 * Confere se a cortesia pode ser criada: plano existe, cabe nas vagas e o
 * aluno não tem outra assinatura vigente.
 * @param input Aluno (se já existe), plano e disciplinas.
 * @returns Erro para mostrar no formulário ou null.
 */
export async function checkCourtesy(input: {
  studentId: number | null;
  planId: number;
  courseIds: number[];
}): Promise<ActionState | null> {
  const plan = await prisma.plan.findUnique({ where: { id: input.planId } });
  if (!plan) return { ok: false, fieldErrors: { planId: ["Plano não encontrado."] } };
  if (new Set(input.courseIds).size > plan.maxCourses) {
    return {
      ok: false,
      fieldErrors: { courseIds: [`Este plano tem ${plan.maxCourses} vaga(s).`] },
    };
  }
  if (input.studentId) {
    const current = await prisma.subscription.findFirst({
      where: {
        studentId: input.studentId,
        status: { in: [...ACCESS_STATUSES] },
        currentPeriodEnd: { gt: new Date() },
      },
    });
    if (current) {
      return {
        ok: false,
        message: "Este aluno já tem uma assinatura vigente. Edite-a pelo lápis em Assinaturas.",
      };
    }
  }
  return null;
}
