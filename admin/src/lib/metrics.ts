// Números dos gráficos do Resumo. O volume é pequeno (um professor, centenas
// de alunos), então as contas por dia/mês são feitas aqui em vez de SQL cru.
import { prisma } from "@portfolio/database";
import { countByBucket, periodBuckets, type Period } from "@/lib/period";
import { ACCESS_STATUSES } from "@/lib/subscription-rules";

/** Ponto de um gráfico no tempo: rótulo do eixo + um valor por série. */
export type TimePoint = { key: string; label: string; values: number[] };

/** Item de uma lista ordenada (barras horizontais). */
export type RankItem = { label: string; hint?: string; value: number; extra?: string };

const PAID_STATUSES = ["confirmed", "received"] as const;
const TOP = 8;

/** Filtro "assinatura vigente agora" (dá acesso). */
function vigenteWhere(now: Date) {
  return { status: { in: [...ACCESS_STATUSES] }, currentPeriodEnd: { gt: now } };
}

/** Monta as colunas do período com uma ou mais séries contadas. */
function timeSeries(period: Period, series: (Date | null)[][]): TimePoint[] {
  const counts = series.map((dates) => countByBucket(dates, period));
  return periodBuckets(period).map((b) => ({
    key: b.key,
    label: b.label,
    values: counts.map((c) => c.get(b.key) ?? 0),
  }));
}

/**
 * Assinantes pagos, cortesias e não assinantes agora (alunos anonimizados
 * não contam).
 * @returns Os três totais.
 */
export async function getAudienceMix(now = new Date()) {
  const [vigentes, students] = await Promise.all([
    prisma.subscription.findMany({
      where: vigenteWhere(now),
      select: { studentId: true, gateway: true },
    }),
    prisma.student.count({ where: { email: { not: { endsWith: "@anonimizado.invalid" } } } }),
  ]);
  const paid = new Set(vigentes.filter((s) => s.gateway === "asaas").map((s) => s.studentId));
  const courtesy = new Set(
    vigentes
      .filter((s) => s.gateway === "manual" && !paid.has(s.studentId))
      .map((s) => s.studentId),
  );
  return {
    paid: paid.size,
    courtesy: courtesy.size,
    none: Math.max(0, students - paid.size - courtesy.size),
  };
}

/**
 * Novos cadastros, novas assinaturas pagas e novas cortesias por dia/mês.
 * @param period Período.
 * @returns Pontos com 3 séries.
 */
export async function getGrowth(period: Period): Promise<TimePoint[]> {
  const range = { gte: period.from, lte: period.to };
  const [students, subscriptions] = await Promise.all([
    prisma.student.findMany({ where: { createdAt: range }, select: { createdAt: true } }),
    prisma.subscription.findMany({
      where: { createdAt: range },
      select: { createdAt: true, gateway: true },
    }),
  ]);
  return timeSeries(period, [
    students.map((s) => s.createdAt),
    subscriptions.filter((s) => s.gateway === "asaas").map((s) => s.createdAt),
    subscriptions.filter((s) => s.gateway === "manual").map((s) => s.createdAt),
  ]);
}

/**
 * Cancelamentos por dia/mês: assinaturas pagas e cortesias encerradas.
 * @param period Período.
 * @returns Pontos com 2 séries.
 */
export async function getCancellations(period: Period): Promise<TimePoint[]> {
  const rows = await prisma.subscription.findMany({
    where: { canceledAt: { gte: period.from, lte: period.to } },
    select: { canceledAt: true, gateway: true },
  });
  return timeSeries(period, [
    rows.filter((r) => r.gateway === "asaas").map((r) => r.canceledAt),
    rows.filter((r) => r.gateway === "manual").map((r) => r.canceledAt),
  ]);
}

/**
 * Receita (cobranças pagas, em centavos) por mês do período.
 * @param period Período.
 * @returns Um ponto por mês, valor em centavos.
 */
export async function getRevenueByMonth(period: Period): Promise<TimePoint[]> {
  const payments = await prisma.payment.findMany({
    where: { status: { in: [...PAID_STATUSES] }, paidAt: { gte: period.from, lte: period.to } },
    select: { paidAt: true, amountCents: true },
  });
  const monthly: Period = { ...period, bucket: "month" };
  const sums = new Map<string, number>();
  for (const p of payments) {
    if (!p.paidAt) continue;
    const key = new Date(p.paidAt.getTime() - 4 * 3600_000).toISOString().slice(0, 7);
    sums.set(key, (sums.get(key) ?? 0) + p.amountCents);
  }
  return periodBuckets(monthly).map((b) => ({
    key: b.key,
    label: b.label,
    values: [sums.get(b.key) ?? 0],
  }));
}

/**
 * Disciplinas mais escolhidas nas vagas das assinaturas vigentes.
 * @returns Até 8 disciplinas, da mais escolhida para a menos.
 */
export async function getTopCourses(now = new Date()): Promise<RankItem[]> {
  const rows = await prisma.subscriptionCourse.groupBy({
    by: ["courseId"],
    where: { subscription: vigenteWhere(now) },
    _count: { _all: true },
    orderBy: { _count: { courseId: "desc" } },
    take: TOP,
  });
  const courses = await prisma.course.findMany({
    where: { id: { in: rows.map((r) => r.courseId) } },
    select: { id: true, title: true, group: { select: { name: true } } },
  });
  return rows.map((r) => {
    const course = courses.find((c) => c.id === r.courseId);
    return {
      label: course?.title ?? `#${r.courseId}`,
      hint: course?.group.name,
      value: r._count._all,
    };
  });
}

/**
 * Aulas mais assistidas no período (vezes que o vídeo foi aberto) e a taxa
 * de conclusão de cada uma (alunos que concluíram ÷ alunos que começaram).
 * @param period Período.
 * @returns Até 8 aulas.
 */
export async function getTopLessons(period: Period): Promise<RankItem[]> {
  const plays = await prisma.accessLog.groupBy({
    by: ["lessonId"],
    where: {
      event: "play",
      lessonId: { not: null },
      createdAt: { gte: period.from, lte: period.to },
    },
    _count: { _all: true },
    orderBy: { _count: { lessonId: "desc" } },
    take: TOP,
  });
  const ids = plays.flatMap((p) => (p.lessonId ? [p.lessonId] : []));
  const [lessons, progress] = await Promise.all([
    prisma.lesson.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        topic: { select: { module: { select: { course: { select: { title: true } } } } } },
      },
    }),
    prisma.lessonProgress.findMany({
      where: { lessonId: { in: ids } },
      select: { lessonId: true, completedAt: true },
    }),
  ]);
  return plays.map((p) => {
    const lesson = lessons.find((l) => l.id === p.lessonId);
    const rows = progress.filter((r) => r.lessonId === p.lessonId);
    const done = rows.filter((r) => r.completedAt).length;
    return {
      label: lesson?.title ?? `Aula #${p.lessonId}`,
      hint: lesson?.topic.module.course.title,
      value: p._count._all,
      extra: rows.length
        ? `${Math.round((done / rows.length) * 100)}% concluíram`
        : "sem progresso",
    };
  });
}

/**
 * Atividades mais feitas no período (tentativas enviadas) e a média de nota
 * em porcentagem da nota máxima.
 * @param period Período.
 * @returns Até 8 atividades e a média geral (null sem notas).
 */
export async function getTopActivities(
  period: Period,
): Promise<{ items: RankItem[]; average: number | null }> {
  const attempts = await prisma.activityAttempt.findMany({
    where: { submittedAt: { gte: period.from, lte: period.to } },
    select: { activityId: true, score: true, maxScore: true },
  });
  const byActivity = new Map<number, { count: number; percents: number[] }>();
  const all: number[] = [];
  for (const a of attempts) {
    const entry = byActivity.get(a.activityId) ?? { count: 0, percents: [] };
    entry.count += 1;
    const max = a.maxScore ? Number(a.maxScore) : 0;
    if (a.score !== null && max > 0) {
      const percent = (Number(a.score) / max) * 100;
      entry.percents.push(percent);
      all.push(percent);
    }
    byActivity.set(a.activityId, entry);
  }
  const top = [...byActivity.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, TOP);
  const activities = await prisma.activity.findMany({
    where: { id: { in: top.map(([id]) => id) } },
    select: { id: true, title: true, module: { select: { course: { select: { title: true } } } } },
  });
  const avg = (values: number[]) =>
    values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
  return {
    average: avg(all),
    items: top.map(([id, entry]) => {
      const activity = activities.find((a) => a.id === id);
      const mean = avg(entry.percents);
      return {
        label: activity?.title ?? `Atividade #${id}`,
        hint: activity?.module.course.title,
        value: entry.count,
        extra: mean === null ? "sem nota" : `média ${Math.round(mean)}%`,
      };
    }),
  };
}

/**
 * Acessos (entradas na plataforma) por dia/mês e alunos diferentes.
 * @param period Período.
 * @returns Pontos com 1 série e o total de alunos distintos.
 */
export async function getAccesses(
  period: Period,
): Promise<{ points: TimePoint[]; students: number }> {
  const logs = await prisma.accessLog.findMany({
    where: { event: "login", createdAt: { gte: period.from, lte: period.to } },
    select: { createdAt: true, studentId: true },
  });
  return {
    points: timeSeries(period, [logs.map((l) => l.createdAt)]),
    students: new Set(logs.map((l) => l.studentId)).size,
  };
}
