// Relatórios do painel. Cada relatório monta colunas e linhas já formatadas;
// a mesma saída alimenta a tabela da página, o CSV e a página de impressão
// (PDF), para os três nunca mostrarem números diferentes.
import { prisma, type Prisma } from "@portfolio/database";
import { formatDate, formatMoney } from "@/lib/format";
import { SUBSCRIPTION_STATUSES, signInMethodsLabel } from "@/lib/labels";
import type { Period } from "@/lib/period";
import { ACCESS_STATUSES } from "@/lib/subscription-rules";

export const REPORT_KEYS = [
  "assinantes",
  "nao-assinantes",
  "cancelados",
  "cortesias",
  "uso-disciplina",
  "uso-aula",
] as const;
export type ReportKey = (typeof REPORT_KEYS)[number];

export const REPORT_LABELS: Record<ReportKey, string> = {
  assinantes: "Assinantes",
  "nao-assinantes": "Não assinantes",
  cancelados: "Cancelados",
  cortesias: "Cortesias",
  "uso-disciplina": "Uso por disciplina",
  "uso-aula": "Uso por aula",
};

/** Relatório pronto para mostrar ou exportar. */
export type Report = {
  key: ReportKey;
  title: string;
  description: string;
  /** O filtro de período vale para este relatório? */
  usesPeriod: boolean;
  columns: string[];
  /** Colunas numéricas (alinhadas à direita). */
  numeric: number[];
  rows: string[][];
};

export type ReportFilters = { period: Period; q?: string };

const ANONYMIZED = "@anonimizado.invalid";

/**
 * Valida a chave do relatório vinda da URL.
 * @param value Texto da URL.
 * @returns Chave válida (padrão: assinantes).
 */
export function parseReportKey(value: string | undefined): ReportKey {
  return (REPORT_KEYS as readonly string[]).includes(value ?? "")
    ? (value as ReportKey)
    : "assinantes";
}

/** Busca por nome ou e-mail do aluno. */
function studentSearch(q?: string): Prisma.StudentWhereInput {
  return q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {};
}

/** Disciplinas das vagas em texto ("Física 1, Química"). */
function slotsText(courses: { slotNumber: number; course: { title: string } }[]): string {
  return courses
    .slice()
    .sort((a, b) => a.slotNumber - b.slotNumber)
    .map((c) => c.course.title)
    .join(", ");
}

const subscriptionInclude = {
  student: { select: { name: true, email: true } },
  plan: { select: { name: true } },
  courses: { select: { slotNumber: true, course: { select: { title: true } } } },
} satisfies Prisma.SubscriptionInclude;

/**
 * Monta um relatório.
 * @param key Qual relatório.
 * @param filters Período e busca por texto.
 * @returns Colunas e linhas formatadas.
 */
export async function getReport(key: ReportKey, filters: ReportFilters): Promise<Report> {
  const now = new Date();
  const { period, q } = filters;
  const range = { gte: period.from, lte: period.to };
  const base = { key, title: REPORT_LABELS[key] };

  if (key === "assinantes" || key === "cortesias") {
    const paid = key === "assinantes";
    const rows = await prisma.subscription.findMany({
      where: {
        gateway: paid ? "asaas" : "manual",
        status: { in: [...ACCESS_STATUSES] },
        currentPeriodEnd: { gt: now },
        student: studentSearch(q),
      },
      orderBy: { student: { name: "asc" } },
      include: subscriptionInclude,
    });
    return {
      ...base,
      description: paid
        ? "Assinaturas pagas com acesso agora."
        : "Cortesias (sem cobrança) com acesso agora.",
      usesPeriod: false,
      columns: paid
        ? [
            "Aluno",
            "E-mail",
            "Plano",
            "Valor",
            "Disciplinas",
            "Desde",
            "Próxima cobrança",
            "Status",
          ]
        : ["Aluno", "E-mail", "Plano", "Disciplinas", "Início", "Acesso até", "Dias restantes"],
      numeric: paid ? [3] : [6],
      rows: rows.map((s) =>
        paid
          ? [
              s.student.name,
              s.student.email,
              s.plan.name,
              formatMoney(s.priceCents),
              slotsText(s.courses),
              formatDate(s.currentPeriodStart ?? s.createdAt),
              s.status === "canceled" ? "— (cancelada)" : formatDate(s.currentPeriodEnd),
              SUBSCRIPTION_STATUSES[s.status],
            ]
          : [
              s.student.name,
              s.student.email,
              s.plan.name,
              slotsText(s.courses),
              formatDate(s.currentPeriodStart ?? s.createdAt),
              formatDate(s.currentPeriodEnd),
              String(
                Math.max(
                  0,
                  Math.ceil(((s.currentPeriodEnd?.getTime() ?? 0) - now.getTime()) / 86_400_000),
                ),
              ),
            ],
      ),
    };
  }

  if (key === "nao-assinantes") {
    const students = await prisma.student.findMany({
      where: {
        email: { not: { endsWith: ANONYMIZED } },
        ...studentSearch(q),
        subscriptions: {
          none: { status: { in: [...ACCESS_STATUSES] }, currentPeriodEnd: { gt: now } },
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        name: true,
        email: true,
        createdAt: true,
        emailVerified: true,
        accounts: { select: { providerId: true } },
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, gateway: true, currentPeriodEnd: true },
        },
      },
    });
    return {
      ...base,
      description: "Alunos cadastrados sem assinatura nem cortesia vigente.",
      usesPeriod: false,
      columns: [
        "Aluno",
        "E-mail",
        "Cadastro",
        "Como entra",
        "E-mail confirmado",
        "Última assinatura",
      ],
      numeric: [],
      rows: students.map((s) => {
        const last = s.subscriptions[0];
        return [
          s.name,
          s.email,
          formatDate(s.createdAt),
          signInMethodsLabel(s.accounts.map((a) => a.providerId)),
          s.emailVerified ? "Sim" : "Não",
          last
            ? `${last.gateway === "manual" ? "Cortesia" : "Paga"} · ${SUBSCRIPTION_STATUSES[last.status]} · até ${formatDate(last.currentPeriodEnd)}`
            : "Nunca assinou",
        ];
      }),
    };
  }

  if (key === "cancelados") {
    const rows = await prisma.subscription.findMany({
      where: { canceledAt: range, student: studentSearch(q) },
      orderBy: { canceledAt: "desc" },
      include: subscriptionInclude,
    });
    return {
      ...base,
      description: "Assinaturas e cortesias canceladas ou encerradas no período.",
      usesPeriod: true,
      columns: [
        "Aluno",
        "E-mail",
        "Tipo",
        "Plano",
        "Disciplinas",
        "Cancelada em",
        "Acesso até",
        "Status",
      ],
      numeric: [],
      rows: rows.map((s) => [
        s.student.name,
        s.student.email,
        s.gateway === "manual" ? "Cortesia" : "Paga",
        s.plan.name,
        slotsText(s.courses),
        formatDate(s.canceledAt),
        formatDate(s.currentPeriodEnd),
        SUBSCRIPTION_STATUSES[s.status],
      ]),
    };
  }

  if (key === "uso-disciplina") {
    const courses = await prisma.course.findMany({
      where: { status: { not: "archived" }, ...(q ? { title: { contains: q } } : {}) },
      orderBy: [
        { group: { category: { sortOrder: "asc" } } },
        { group: { sortOrder: "asc" } },
        { sortOrder: "asc" },
      ],
      select: {
        id: true,
        title: true,
        group: { select: { name: true, category: { select: { name: true } } } },
      },
    });
    const ids = courses.map((c) => c.id);
    const [slots, plays, completed, attempts] = await Promise.all([
      prisma.subscriptionCourse.groupBy({
        by: ["courseId"],
        where: {
          courseId: { in: ids },
          subscription: { status: { in: [...ACCESS_STATUSES] }, currentPeriodEnd: { gt: now } },
        },
        _count: { _all: true },
      }),
      prisma.accessLog.findMany({
        where: {
          event: "play",
          createdAt: range,
          lesson: { topic: { module: { courseId: { in: ids } } } },
        },
        select: {
          studentId: true,
          lesson: { select: { topic: { select: { module: { select: { courseId: true } } } } } },
        },
      }),
      prisma.lessonProgress.findMany({
        where: { completedAt: range, lesson: { topic: { module: { courseId: { in: ids } } } } },
        select: {
          lesson: { select: { topic: { select: { module: { select: { courseId: true } } } } } },
        },
      }),
      prisma.activityAttempt.findMany({
        where: { submittedAt: range, activity: { module: { courseId: { in: ids } } } },
        select: {
          score: true,
          maxScore: true,
          activity: { select: { module: { select: { courseId: true } } } },
        },
      }),
    ]);
    return {
      ...base,
      description: "Alunos nas vagas (agora) e uso de cada disciplina no período.",
      usesPeriod: true,
      columns: [
        "Disciplina",
        "Categoria › Grupo",
        "Alunos nas vagas",
        "Vídeos abertos",
        "Alunos que assistiram",
        "Aulas concluídas",
        "Tentativas",
        "Média das notas",
      ],
      numeric: [2, 3, 4, 5, 6, 7],
      rows: courses.map((c) => {
        const coursePlays = plays.filter((p) => p.lesson?.topic.module.courseId === c.id);
        const courseAttempts = attempts.filter((a) => a.activity.module.courseId === c.id);
        return [
          c.title,
          `${c.group.category.name} › ${c.group.name}`,
          String(slots.find((s) => s.courseId === c.id)?._count._all ?? 0),
          String(coursePlays.length),
          String(new Set(coursePlays.map((p) => p.studentId)).size),
          String(completed.filter((r) => r.lesson.topic.module.courseId === c.id).length),
          String(courseAttempts.length),
          averagePercent(courseAttempts),
        ];
      }),
    };
  }

  // uso-aula
  const lessons = await prisma.lesson.findMany({
    where: { status: "published", ...(q ? { title: { contains: q } } : {}) },
    select: {
      id: true,
      title: true,
      topic: { select: { module: { select: { course: { select: { title: true } } } } } },
    },
  });
  const ids = lessons.map((l) => l.id);
  const [plays, progress] = await Promise.all([
    prisma.accessLog.findMany({
      where: { event: "play", createdAt: range, lessonId: { in: ids } },
      select: { lessonId: true, studentId: true },
    }),
    prisma.lessonProgress.findMany({
      where: { lessonId: { in: ids } },
      select: { lessonId: true, completedAt: true },
    }),
  ]);
  const rows = lessons.map((l) => {
    const lessonPlays = plays.filter((p) => p.lessonId === l.id);
    const lessonProgress = progress.filter((p) => p.lessonId === l.id);
    const done = lessonProgress.filter((p) => p.completedAt).length;
    return {
      views: lessonPlays.length,
      row: [
        l.title,
        l.topic.module.course.title,
        String(lessonPlays.length),
        String(new Set(lessonPlays.map((p) => p.studentId)).size),
        String(lessonProgress.length),
        String(done),
        lessonProgress.length ? `${Math.round((done / lessonProgress.length) * 100)}%` : "—",
      ],
    };
  });
  return {
    ...base,
    description: "Vídeos abertos no período; progresso e conclusão desde sempre.",
    usesPeriod: true,
    columns: [
      "Aula",
      "Disciplina",
      "Vídeos abertos",
      "Alunos",
      "Começaram",
      "Concluíram",
      "Taxa de conclusão",
    ],
    numeric: [2, 3, 4, 5, 6],
    rows: rows.sort((a, b) => b.views - a.views).map((r) => r.row),
  };
}

/** Média das notas em % da nota máxima ("—" sem notas). */
function averagePercent(
  attempts: { score: Prisma.Decimal | null; maxScore: Prisma.Decimal | null }[],
): string {
  const percents = attempts.flatMap((a) =>
    a.score !== null && a.maxScore && Number(a.maxScore) > 0
      ? [(Number(a.score) / Number(a.maxScore)) * 100]
      : [],
  );
  if (!percents.length) return "—";
  return `${Math.round(percents.reduce((s, v) => s + v, 0) / percents.length)}%`;
}

/**
 * Converte o relatório em CSV para Excel em português: separador ";", BOM
 * UTF-8, aspas em todo campo e proteção contra fórmulas.
 * @param report Relatório montado.
 * @returns Texto do arquivo.
 */
export function reportToCsv(report: Report): string {
  // Nome começando com = + - @ viraria fórmula no Excel: o apóstrofo impede.
  const cell = (value: string) =>
    `"${(/^[=+\-@]/.test(value) ? `'${value}` : value).replace(/"/g, '""')}"`;
  const lines = [report.columns, ...report.rows].map((row) => row.map(cell).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}
