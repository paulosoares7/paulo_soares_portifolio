// Atividade aberta no site e correção automática (RN16).
// O gabarito nunca sai do servidor: o navegador recebe só enunciados e alternativas.
import { cache } from "react";
import { prisma } from "@portfolio/database";
import { viewerAccess } from "@/lib/access";

/**
 * Atividade publicada com o acesso do visitante.
 * @param id ID da atividade.
 * @returns Atividade (sem gabarito) ou null.
 */
export const getActivityPage = cache(async (id: number) => {
  const activity = await prisma.activity.findFirst({
    where: {
      id,
      status: "published",
      module: { status: "published", course: { status: "published" } },
    },
    select: {
      id: true,
      title: true,
      instructions: true,
      difficulty: true,
      isPreview: true,
      showAnswers: true,
      module: {
        select: { title: true, course: { select: { id: true, slug: true, title: true } } },
      },
      questions: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          statement: true,
          points: true,
          unit: true,
          imageFile: { select: { publicUrl: true } },
          // Sem is_correct, numeric_answer nem explanation aqui.
          options: { orderBy: { sortOrder: "asc" }, select: { id: true, text: true } },
        },
      },
    },
  });
  if (!activity) return null;
  const access = await viewerAccess({
    isPreview: activity.isPreview,
    courseId: activity.module.course.id,
  });
  return { ...activity, access };
});

/** Resposta enviada para uma questão. */
export type Answer = {
  questionId: number;
  optionId?: number | null;
  value?: string | null;
  text?: string | null;
};

/** Resultado de uma questão depois da correção. */
export type QuestionResult = {
  questionId: number;
  status: "correct" | "wrong" | "ungraded";
  points: number;
  correctOptionIds?: number[];
  expected?: string;
  explanation?: string | null;
  feedback?: string | null;
};

/** Resultado da tentativa. */
export type GradeResult = {
  score: number;
  maxScore: number;
  revealed: boolean;
  results: QuestionResult[];
};

/**
 * Número digitado ("12,5" ou "12.5") para float.
 * @param value Texto.
 * @returns Número ou null.
 */
function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * RN16: correta quando |resposta − gabarito| ≤ tolerância% × |gabarito|.
 * @param answer Resposta do aluno.
 * @param key Gabarito.
 * @param tolerancePct Tolerância em %.
 * @returns true se estiver dentro da tolerância.
 */
export function isWithinTolerance(answer: number, key: number, tolerancePct: number): boolean {
  // Pequena folga de ponto flutuante para casos como 25 vs 24.75 com 1%.
  return Math.abs(answer - key) <= (Math.abs(key) * tolerancePct) / 100 + 1e-9;
}

/**
 * Corrige as respostas de uma atividade (múltipla escolha e numérica).
 * Abertas não são corrigidas aqui: dependem do professor (só assinantes).
 * @param activityId Atividade.
 * @param answers Respostas do visitante.
 * @returns Nota e resultado por questão, revelando a resolução conforme a regra da atividade.
 */
export async function gradeActivity(activityId: number, answers: Answer[]): Promise<GradeResult> {
  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: activityId },
    select: {
      showAnswers: true,
      questions: {
        select: {
          id: true,
          type: true,
          points: true,
          numericAnswer: true,
          tolerancePct: true,
          unit: true,
          explanation: true,
          options: { select: { id: true, isCorrect: true, feedback: true } },
        },
      },
    },
  });
  // Visitante não tem histórico de tentativas: "após a última tentativa" não se
  // completa, então só a regra "após enviar" revela a resolução.
  const revealed = activity.showAnswers === "after_submit";
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));

  let score = 0;
  let maxScore = 0;
  const results: QuestionResult[] = activity.questions.map((q) => {
    const points = Number(q.points);
    const answer = byQuestion.get(q.id);
    if (q.type === "open") return { questionId: q.id, status: "ungraded", points: 0 };

    maxScore += points;
    let correct = false;
    let feedback: string | null = null;
    let expected: string | undefined;
    let correctOptionIds: number[] | undefined;

    if (q.type === "multiple_choice") {
      const chosen = q.options.find((o) => o.id === answer?.optionId);
      correct = !!chosen?.isCorrect;
      feedback = chosen?.feedback ?? null;
      correctOptionIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
    } else {
      const value = parseNumber(answer?.value);
      const key = q.numericAnswer === null ? null : Number(q.numericAnswer);
      correct =
        value !== null &&
        key !== null &&
        isWithinTolerance(value, key, Number(q.tolerancePct ?? 0));
      expected =
        key === null ? undefined : `${key.toLocaleString("pt-BR")}${q.unit ? ` ${q.unit}` : ""}`;
    }
    if (correct) score += points;

    return {
      questionId: q.id,
      status: correct ? "correct" : "wrong",
      points: correct ? points : 0,
      ...(revealed ? { correctOptionIds, expected, explanation: q.explanation, feedback } : {}),
    };
  });

  return { score, maxScore, revealed, results };
}
