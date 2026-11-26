// Dados da "Minha área" do aluno logado.
import { prisma } from "@portfolio/database";

/**
 * Formas de entrar, sessões abertas e a assinatura vigente do aluno.
 * @param studentId Aluno logado.
 * @returns Dados da minha área.
 */
export async function getStudentArea(studentId: number) {
  const now = new Date();
  const [accounts, openSessions, subscription] = await Promise.all([
    prisma.studentAccount.findMany({ where: { studentId }, select: { providerId: true } }),
    prisma.studentSession.count({ where: { studentId, expiresAt: { gt: now } } }),
    // Mesma regra da visão v_student_course_access: ativa, ou cancelada/em
    // atraso ainda dentro do período pago.
    prisma.subscription.findFirst({
      where: {
        studentId,
        status: { in: ["active", "past_due", "canceled"] },
        currentPeriodEnd: { gt: now },
      },
      orderBy: { currentPeriodEnd: "desc" },
      select: {
        status: true,
        gateway: true,
        currentPeriodEnd: true,
        plan: { select: { name: true, maxCourses: true } },
        courses: {
          orderBy: { slotNumber: "asc" },
          select: { slotNumber: true, course: { select: { title: true, slug: true } } },
        },
      },
    }),
  ]);
  const providers = new Set(accounts.map((a) => a.providerId));
  return {
    signInMethods: {
      google: providers.has("google"),
      password: providers.has("credential"),
    },
    openSessions,
    subscription,
  };
}
