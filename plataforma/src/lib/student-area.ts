// Dados da "Minha área" do aluno logado.
import { prisma } from "@portfolio/database";
import { DISPLAY_TIME_ZONE } from "@/lib/format";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Dias mostrados no "dias de estudo" do painel (hoje e os 6 anteriores). */
export const STUDY_WINDOW_DAYS = 7;

// Chave do dia no fuso de Manaus (AAAA-MM-DD) e o nome curto do dia.
const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DISPLAY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: DISPLAY_TIME_ZONE,
  weekday: "short",
});

/** Um dia da faixa "dias de estudo". */
export type StudyDay = { key: string; label: string; studied: boolean };

/**
 * Últimos 7 dias (do mais antigo para hoje), marcando os que tiveram estudo.
 * @param dates Momentos de estudo (aula aberta ou concluída, vídeo, atividade).
 * @param now Agora.
 * @returns Os 7 dias com o nome curto ("seg") e se houve estudo.
 */
function studyDays(dates: Date[], now: Date): StudyDay[] {
  const studied = new Set(dates.map((d) => dayKeyFormatter.format(d)));
  return Array.from({ length: STUDY_WINDOW_DAYS }, (_, index) => {
    const day = new Date(now.getTime() - (STUDY_WINDOW_DAYS - 1 - index) * DAY_MS);
    const key = dayKeyFormatter.format(day);
    return { key, label: weekdayFormatter.format(day).replace(".", ""), studied: studied.has(key) };
  });
}

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
 * Painel do aluno: continuar de onde parou, aulas vistas por último,
 * progresso por disciplina, atividades recentes (com média), números de
 * desempenho (aulas concluídas, dias de estudo na semana) e a próxima cobrança.
 * Os minutos assistidos não entram: o YouTube (aulas grátis) não informa
 * quanto foi visto, então o progresso vem do "Aula concluída".
 * @param studentId Aluno logado.
 * @param subscribedCourseIds Disciplinas das vagas (entram no progresso mesmo sem aula vista).
 * @returns Dados do painel.
 */
export async function getStudentDashboard(studentId: number, subscribedCourseIds: number[]) {
  const now = new Date();
  const weekStart = new Date(now.getTime() - STUDY_WINDOW_DAYS * DAY_MS);
  const [progress, attempts, nextPayment, plays] = await Promise.all([
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
    prisma.accessLog.findMany({
      where: { studentId, event: "play", createdAt: { gte: weekStart } },
      select: { createdAt: true },
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

  const studyDates = [
    ...progress.flatMap((p) => (p.completedAt ? [p.updatedAt, p.completedAt] : [p.updatedAt])),
    ...attempts.flatMap((a) => (a.submittedAt ? [a.submittedAt] : [])),
    ...plays.map((p) => p.createdAt),
  ].filter((d) => d >= weekStart);

  return {
    continueLesson: lessons.find((l) => !l.completed) ?? null,
    completedCount: lessons.filter((l) => l.completed).length,
    studyDays: studyDays(studyDates, now),
    hasHistory: progress.length > 0 || attempts.length > 0,
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

/**
 * Última aula aberta e ainda não concluída ("continuar de onde parou"), para a
 * página inicial de quem está logado.
 * @param studentId Aluno logado.
 * @returns Aula com o link ou null.
 */
export async function getContinueLesson(
  studentId: number,
): Promise<{ title: string; href: string; course: string } | null> {
  const row = await prisma.lessonProgress.findFirst({
    where: {
      studentId,
      completedAt: null,
      lesson: {
        status: "published",
        topic: { module: { status: "published", course: { status: "published" } } },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: { lesson: { select: lessonPathSelect } },
  });
  if (!row) return null;
  const { module } = row.lesson.topic;
  return {
    title: row.lesson.title,
    href: `/disciplina/${module.course.slug}/${module.slug}/${row.lesson.slug}`,
    course: module.course.title,
  };
}
