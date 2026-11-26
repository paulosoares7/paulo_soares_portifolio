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
        maxCoursesOverride: true,
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
    // Vagas que valem: a exceção do aluno ou as do plano.
    maxCourses: subscription
      ? (subscription.maxCoursesOverride ?? subscription.plan.maxCourses)
      : 0,
    signInMethods: {
      google: providers.has("google"),
      password: providers.has("credential"),
    },
    openSessions,
    subscription,
  };
}
