// Dados do painel do aluno (a página inicial de quem está logado).
import { prisma } from "@portfolio/database";
import { DISPLAY_TIME_ZONE } from "@/lib/format";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Dias da faixa "dias de estudo na semana" (hoje e os 6 anteriores). */
export const STUDY_WINDOW_DAYS = 7;
/** Dias do calendário de estudo do assinante (4 semanas). */
export const CALENDAR_DAYS = 28;
/** Quantos dias para trás a sequência de estudo é contada. */
const STREAK_LIMIT_DAYS = 60;

// Chave do dia no fuso de Manaus (AAAA-MM-DD), o nome curto do dia e a data.
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
const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: DISPLAY_TIME_ZONE,
  day: "2-digit",
  month: "short",
});

/** Um dia de estudo (faixa da semana ou calendário). */
export type StudyDay = {
  key: string;
  /** Nome curto do dia ("seg"). */
  label: string;
  /** Data curta ("27 de nov."). */
  date: string;
  /** Quantas coisas o aluno fez no dia (aulas, vídeos, atividades). */
  count: number;
};

/**
 * Os últimos N dias (do mais antigo para hoje) com a contagem de estudo.
 * @param counts Contagem por chave de dia.
 * @param days Quantos dias.
 * @param now Agora.
 * @returns Lista de dias.
 */
function lastDays(counts: Map<string, number>, days: number, now: Date): StudyDay[] {
  return Array.from({ length: days }, (_, index) => {
    const day = new Date(now.getTime() - (days - 1 - index) * DAY_MS);
    const key = dayKeyFormatter.format(day);
    return {
      key,
      label: weekdayFormatter.format(day).replace(".", ""),
      date: shortDateFormatter.format(day),
      count: counts.get(key) ?? 0,
    };
  });
}

/**
 * Dias seguidos de estudo até hoje. Se hoje ainda não teve estudo, conta até
 * ontem (a sequência só quebra quando um dia inteiro passa sem estudo).
 * @param counts Contagem por chave de dia.
 * @param now Agora.
 * @returns Número de dias seguidos.
 */
function studyStreak(counts: Map<string, number>, now: Date): number {
  const key = (offset: number) => dayKeyFormatter.format(new Date(now.getTime() - offset * DAY_MS));
  let offset = counts.get(key(0)) ? 0 : 1;
  let streak = 0;
  while (offset <= STREAK_LIMIT_DAYS && counts.get(key(offset))) {
    streak += 1;
    offset += 1;
  }
  return streak;
}

/**
 * Formas de entrar, sessões abertas e a assinatura vigente do aluno.
 * @param studentId Aluno logado.
 * @returns Dados da conta e da assinatura.
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
    // Dias até o fim do período (aviso de cortesia acabando).
    daysLeft: subscription?.currentPeriodEnd
      ? Math.max(0, Math.ceil((subscription.currentPeriodEnd.getTime() - now.getTime()) / DAY_MS))
      : null,
  };
}

/** Dados da conta e da assinatura (getStudentArea). */
export type StudentArea = Awaited<ReturnType<typeof getStudentArea>>;

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

type LessonPath = {
  id: number;
  title: string;
  slug: string;
  topic: {
    module: { slug: string; title: string; course: { id: number; title: string; slug: string } };
  };
};

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
 * Link da página da aula.
 * @param lesson Aula com o caminho (disciplina e módulo).
 * @returns /disciplina/curso/modulo/aula
 */
function lessonHref(lesson: LessonPath): string {
  const { module } = lesson.topic;
  return `/disciplina/${module.course.slug}/${module.slug}/${lesson.slug}`;
}

/**
 * Percentual de acerto de uma tentativa corrigida.
 * @param score Nota.
 * @param maxScore Nota máxima.
 * @returns 0 a 100 ou null (sem correção).
 */
function scorePercent(score: unknown, maxScore: unknown): number | null {
  if (score === null || score === undefined || !maxScore || Number(maxScore) <= 0) return null;
  return (Number(score) / Number(maxScore)) * 100;
}

/**
 * Painel do aluno: continuar de onde parou, aulas vistas por último,
 * progresso por disciplina (com a próxima aula e as atividades), atividades
 * para fazer e recentes, números de desempenho, dias de estudo, sequência,
 * conquistas e a próxima cobrança. Os minutos assistidos não entram: o
 * YouTube (aulas grátis) não informa quanto foi visto; as horas de aula
 * somam a duração dos vídeos das aulas concluídas.
 * @param studentId Aluno logado.
 * @param subscribedCourseIds Disciplinas das vagas (entram no progresso mesmo sem aula vista).
 * @returns Dados do painel.
 */
export async function getStudentDashboard(studentId: number, subscribedCourseIds: number[]) {
  const now = new Date();
  const streakStart = new Date(now.getTime() - (STREAK_LIMIT_DAYS + 1) * DAY_MS);
  const inSubscribed = { in: subscribedCourseIds };
  const [progress, attempts, nextPayment, plays, subscribedLessons, subscribedActivities] =
    await Promise.all([
      prisma.lessonProgress.findMany({
        where: { studentId, lesson: { status: "published" } },
        orderBy: { updatedAt: "desc" },
        select: {
          completedAt: true,
          updatedAt: true,
          lesson: {
            select: { ...lessonPathSelect, video: { select: { durationSeconds: true } } },
          },
        },
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
              module: { select: { course: { select: { id: true, title: true } } } },
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
        where: { studentId, event: "play", createdAt: { gte: streakStart } },
        select: { createdAt: true },
      }),
      // Aulas e atividades das disciplinas da assinatura, na ordem do curso
      // (para a "próxima aula" e as "atividades para fazer").
      subscribedCourseIds.length
        ? prisma.lesson.findMany({
            where: {
              status: "published",
              topic: { module: { courseId: inSubscribed, status: "published" } },
            },
            orderBy: [
              { topic: { module: { sortOrder: "asc" } } },
              { topic: { sortOrder: "asc" } },
              { sortOrder: "asc" },
            ],
            select: lessonPathSelect,
          })
        : Promise.resolve([]),
      subscribedCourseIds.length
        ? prisma.activity.findMany({
            where: { status: "published", module: { courseId: inSubscribed, status: "published" } },
            orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }],
            select: {
              id: true,
              title: true,
              module: { select: { title: true, course: { select: { id: true, title: true } } } },
            },
          })
        : Promise.resolve([]),
    ]);

  const lessons: DashboardLesson[] = progress.map((p) => ({
    id: p.lesson.id,
    title: p.lesson.title,
    href: lessonHref(p.lesson),
    course: p.lesson.topic.module.course.title,
    module: p.lesson.topic.module.title,
    completed: p.completedAt !== null,
    updatedAt: p.updatedAt,
  }));
  const completedIds = new Set(progress.filter((p) => p.completedAt).map((p) => p.lesson.id));
  const submittedActivityIds = new Set(attempts.map((a) => a.activity.id));

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
    const next = subscribedLessons.find(
      (l) => l.topic.module.course.id === id && !completedIds.has(l.id),
    );
    const activities = subscribedActivities.filter((a) => a.module.course.id === id);
    return [
      {
        id,
        title: course.title,
        slug: course.slug,
        total,
        done,
        nextLesson: next ? { title: next.title, href: lessonHref(next) } : null,
        activitiesTotal: activities.length,
        activitiesDone: activities.filter((a) => submittedActivityIds.has(a.id)).length,
      },
    ];
  });

  const percents = attempts.flatMap((a) => {
    const value = scorePercent(a.score, a.maxScore);
    return value === null ? [] : [value];
  });

  // Dias de estudo: aula aberta ou concluída, vídeo iniciado, atividade enviada.
  const counts = new Map<string, number>();
  const studyDates = [
    ...progress.flatMap((p) => (p.completedAt ? [p.updatedAt, p.completedAt] : [p.updatedAt])),
    ...attempts.flatMap((a) => (a.submittedAt ? [a.submittedAt] : [])),
    ...plays.map((p) => p.createdAt),
  ];
  for (const date of studyDates) {
    if (date < streakStart) continue;
    const key = dayKeyFormatter.format(date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const streak = studyStreak(counts, now);
  const completedCount = completedIds.size;
  const subscribedProgress = courseProgress.filter((c) => subscribedCourseIds.includes(c.id));

  const continueLesson = lessons.find((l) => !l.completed) ?? null;
  // Sem aula em andamento: a próxima aula da primeira disciplina da assinatura.
  const suggested = continueLesson
    ? null
    : (subscribedProgress.find((c) => c.nextLesson)?.nextLesson ?? null);

  return {
    continueLesson,
    suggestedLesson: suggested,
    recentLessons: lessons.slice(0, 5),
    courseProgress,
    completedCount,
    completedSeconds: progress.reduce(
      (sum, p) => sum + (p.completedAt ? (p.lesson.video?.durationSeconds ?? 0) : 0),
      0,
    ),
    // Total de aulas publicadas nas disciplinas da assinatura.
    subscribedLessonsTotal: subscribedLessons.length,
    subscribedLessonsDone: subscribedLessons.filter((l) => completedIds.has(l.id)).length,
    pendingActivities: subscribedActivities
      .filter((a) => !submittedActivityIds.has(a.id))
      .map((a) => ({
        id: a.id,
        title: a.title,
        module: a.module.title,
        course: a.module.course.title,
      })),
    activitiesTotal: subscribedActivities.length,
    studyDays: lastDays(counts, STUDY_WINDOW_DAYS, now),
    studyCalendar: lastDays(counts, CALENDAR_DAYS, now),
    streak,
    achievements: [
      { key: "first", label: "Primeira aula", unlocked: completedCount > 0 },
      { key: "streak", label: "7 dias seguidos", unlocked: streak >= 7 },
      {
        key: "course",
        label: "Disciplina completa",
        unlocked: courseProgress.some((c) => c.total > 0 && c.done >= c.total),
      },
    ],
    hasHistory: progress.length > 0 || attempts.length > 0,
    recentAttempts: attempts.slice(0, 5).map((a) => {
      const percent = scorePercent(a.score, a.maxScore);
      return {
        id: a.id,
        activityId: a.activity.id,
        title: a.activity.title,
        course: a.activity.module.course.title,
        submittedAt: a.submittedAt,
        percent: percent === null ? null : Math.round(percent),
      };
    }),
    attemptsCount: attempts.length,
    averagePercent: percents.length
      ? Math.round(percents.reduce((s, v) => s + v, 0) / percents.length)
      : null,
    nextPayment,
  };
}

/** Dados do painel (getStudentDashboard). */
export type StudentDashboard = Awaited<ReturnType<typeof getStudentDashboard>>;
