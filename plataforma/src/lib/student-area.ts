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
          select: { slotNumber: true, course: { select: { id: true, title: true, slug: true } } },
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

/** Caminho da aula: disciplina, módulo e aula. */
const lessonPathSelect = {
  id: true,
  title: true,
  slug: true,
  topic: {
    select: {
      module: {
        select: {
          slug: true,
          title: true,
          course: { select: { id: true, title: true, slug: true } },
        },
      },
    },
  },
} as const;

/** Aula com o link pronto e a disciplina. */
export type DashboardLesson = {
  id: number;
  title: string;
  href: string;
  course: string;
  module: string;
  completed: boolean;
  updatedAt: Date;
};

/**
 * Painel da Minha área: continuar de onde parou, aulas vistas por último,
 * progresso por disciplina, atividades recentes (com média) e a próxima
 * cobrança.
 * @param studentId Aluno logado.
 * @param subscribedCourseIds Disciplinas das vagas (entram no progresso mesmo sem aula vista).
 * @returns Dados do painel.
 */
export async function getStudentDashboard(studentId: number, subscribedCourseIds: number[]) {
  const [progress, attempts, nextPayment] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { studentId, lesson: { status: "published" } },
      orderBy: { updatedAt: "desc" },
      select: { completedAt: true, updatedAt: true, lesson: { select: lessonPathSelect } },
    }),
    prisma.activityAttempt.findMany({
      where: { studentId, submittedAt: { not: null } },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        score: true,
        maxScore: true,
        submittedAt: true,
        activity: {
          select: {
            id: true,
            title: true,
            module: { select: { course: { select: { title: true } } } },
          },
        },
      },
    }),
    prisma.payment.findFirst({
      where: { subscription: { studentId }, status: { in: ["pending", "overdue"] } },
      orderBy: { dueDate: "asc" },
      select: { dueDate: true, amountCents: true, status: true, invoiceUrl: true },
    }),
  ]);

  const lessons: DashboardLesson[] = progress.map((p) => {
    const { module } = p.lesson.topic;
    return {
      id: p.lesson.id,
      title: p.lesson.title,
      href: `/disciplina/${module.course.slug}/${module.slug}/${p.lesson.slug}`,
      course: module.course.title,
      module: module.title,
      completed: p.completedAt !== null,
      updatedAt: p.updatedAt,
    };
  });

  // Progresso: aulas publicadas concluídas ÷ aulas publicadas da disciplina.
  const courseIds = [
    ...new Set([...subscribedCourseIds, ...progress.map((p) => p.lesson.topic.module.course.id)]),
  ];
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds }, status: "published" },
    select: {
      id: true,
      title: true,
      slug: true,
      modules: {
        select: {
          topics: {
            select: { _count: { select: { lessons: { where: { status: "published" } } } } },
          },
        },
      },
    },
  });
  const courseProgress = courseIds.flatMap((id) => {
    const course = courses.find((c) => c.id === id);
    if (!course) return [];
    const total = course.modules
      .flatMap((m) => m.topics)
      .reduce((sum, t) => sum + t._count.lessons, 0);
    const done = progress.filter(
      (p) => p.completedAt && p.lesson.topic.module.course.id === id,
    ).length;
    return [{ id, title: course.title, slug: course.slug, total, done }];
  });

  const percents = attempts.flatMap((a) =>
    a.score !== null && a.maxScore && Number(a.maxScore) > 0
      ? [(Number(a.score) / Number(a.maxScore)) * 100]
      : [],
  );

  return {
    continueLesson: lessons.find((l) => !l.completed) ?? null,
    recentLessons: lessons.slice(0, 5),
    courseProgress,
    recentAttempts: attempts.slice(0, 5).map((a) => ({
      id: a.id,
      activityId: a.activity.id,
      title: a.activity.title,
      course: a.activity.module.course.title,
      submittedAt: a.submittedAt,
      percent:
        a.score !== null && a.maxScore && Number(a.maxScore) > 0
          ? Math.round((Number(a.score) / Number(a.maxScore)) * 100)
          : null,
    })),
    attemptsCount: attempts.length,
    averagePercent: percents.length
      ? Math.round(percents.reduce((s, v) => s + v, 0) / percents.length)
      : null,
    nextPayment,
  };
}
