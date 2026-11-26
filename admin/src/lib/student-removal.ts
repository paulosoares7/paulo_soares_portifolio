// Excluir aluno (RN14, LGPD): sem histórico, apaga; com histórico, anonimiza.
import { prisma, type Prisma } from "@portfolio/database";

/** O que o aluno deixou na plataforma (decide entre apagar e anonimizar). */
export type StudentFootprint = {
  payments: number;
  paidSubscriptions: number;
  courtesies: number;
  forumPosts: number;
  lessonProgress: number;
  activityAttempts: number;
  accessLogs: number;
  /** Assinaturas do Asaas ainda cobrando (precisam ser canceladas lá). */
  activeAsaasIds: string[];
};

/**
 * Conta o histórico do aluno.
 * @param studentId Aluno.
 * @returns Contagens e as assinaturas do Asaas ainda ativas.
 */
export async function getStudentFootprint(studentId: number): Promise<StudentFootprint> {
  const [
    payments,
    paidSubscriptions,
    courtesies,
    posts,
    threads,
    lessonProgress,
    activityAttempts,
    accessLogs,
    asaas,
  ] = await Promise.all([
    prisma.payment.count({ where: { subscription: { studentId } } }),
    prisma.subscription.count({ where: { studentId, gateway: "asaas" } }),
    prisma.subscription.count({ where: { studentId, gateway: "manual" } }),
    prisma.forumPost.count({ where: { studentId } }),
    prisma.forumThread.count({ where: { studentId } }),
    prisma.lessonProgress.count({ where: { studentId } }),
    prisma.activityAttempt.count({ where: { studentId } }),
    prisma.accessLog.count({ where: { studentId } }),
    prisma.subscription.findMany({
      where: {
        studentId,
        gateway: "asaas",
        status: { in: ["pending", "active", "past_due"] },
        gatewaySubscriptionId: { not: null },
      },
      select: { gatewaySubscriptionId: true },
    }),
  ]);
  return {
    payments,
    paidSubscriptions,
    courtesies,
    forumPosts: posts + threads,
    lessonProgress,
    activityAttempts,
    accessLogs,
    activeAsaasIds: asaas.flatMap((s) =>
      s.gatewaySubscriptionId ? [s.gatewaySubscriptionId] : [],
    ),
  };
}

/**
 * Diz se o aluno precisa ser anonimizado em vez de apagado: tem cobrança,
 * assinatura paga, post no fórum ou histórico de estudo/acesso. Só cortesia
 * não conta (é apagada junto).
 * @param footprint Histórico do aluno.
 * @returns true = anonimizar.
 */
export function mustAnonymize(footprint: StudentFootprint): boolean {
  return (
    footprint.payments +
      footprint.paidSubscriptions +
      footprint.forumPosts +
      footprint.lessonProgress +
      footprint.activityAttempts +
      footprint.accessLogs >
    0
  );
}

/**
 * Anonimiza o aluno: apaga nome, e-mail, foto e IPs, remove as formas de
 * entrar e as sessões, e encerra as assinaturas com acesso. Cobranças e
 * posts ficam (registro financeiro e conversa do fórum), com autor anônimo.
 * @param tx Transação do Prisma.
 * @param studentId Aluno.
 */
export async function anonymizeStudentData(
  tx: Prisma.TransactionClient,
  studentId: number,
): Promise<void> {
  const now = new Date();
  await tx.student.update({
    where: { id: studentId },
    data: {
      name: `Aluno removido #${studentId}`,
      displayName: "Anônimo",
      email: `removido-${studentId}@anonimizado.invalid`,
      emailVerified: false,
      image: null,
      isBlocked: true,
    },
  });
  // Sem contas vinculadas, ninguém entra mais nesta conta (nem pelo Google).
  await tx.studentAccount.deleteMany({ where: { studentId } });
  await tx.studentSession.deleteMany({ where: { studentId } });
  await tx.accessLog.updateMany({ where: { studentId }, data: { ipAddress: null } });
  await tx.subscription.updateMany({
    where: { studentId, status: { in: ["pending", "active", "past_due", "canceled"] } },
    data: { status: "canceled", canceledAt: now, currentPeriodEnd: now },
  });
}

/**
 * Apaga o aluno sem histórico. As cortesias (e as vagas delas) vão junto;
 * formas de entrar, sessões e o resto caem em cascata no banco.
 * @param tx Transação do Prisma.
 * @param studentId Aluno.
 */
export async function deleteStudentData(
  tx: Prisma.TransactionClient,
  studentId: number,
): Promise<void> {
  await tx.subscription.deleteMany({ where: { studentId, gateway: "manual" } });
  await tx.student.delete({ where: { id: studentId } });
}
