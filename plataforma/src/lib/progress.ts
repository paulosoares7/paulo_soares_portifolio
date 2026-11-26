// Uso do aluno: progresso nas aulas, vídeos abertos e tentativas de
// atividade. Alimenta a "Minha área" e os gráficos/relatórios do painel.
import { prisma } from "@portfolio/database";
import type { Answer, GradeResult } from "@/lib/activity";

/** Abrir a mesma aula de novo dentro deste prazo não conta outro acesso. */
const PLAY_DEDUP_MS = 30 * 60 * 1000;

/**
 * Registra que o aluno abriu a aula: marca a aula como "assistida por último"
 * (para o "continuar de onde parou") e grava o acesso ao vídeo.
 * @param studentId Aluno logado (com acesso à aula, conferido antes).
 * @param lessonId Aula.
 * @param hasVideo A aula tem vídeo para assistir (senão não conta "play").
 */
export async function recordLessonView(
  studentId: number,
  lessonId: number,
  hasVideo: boolean,
): Promise<void> {
  const now = new Date();
  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    create: { studentId, lessonId },
    update: { updatedAt: now },
  });
  if (!hasVideo) return;
  const recent = await prisma.accessLog.findFirst({
    where: {
      studentId,
      lessonId,
      event: "play",
      createdAt: { gt: new Date(now.getTime() - PLAY_DEDUP_MS) },
    },
    select: { id: true },
  });
  if (!recent) await prisma.accessLog.create({ data: { studentId, lessonId, event: "play" } });
}

/**
 * Marca ou desmarca a aula como concluída.
 * @param studentId Aluno.
 * @param lessonId Aula.
 * @param done true = concluída.
 */
export async function setLessonCompleted(
  studentId: number,
  lessonId: number,
  done: boolean,
): Promise<void> {
  const completedAt = done ? new Date() : null;
  await prisma.lessonProgress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    create: { studentId, lessonId, completedAt },
    update: { completedAt },
  });
}

/**
 * Diz se o aluno já concluiu a aula.
 * @param studentId Aluno.
 * @param lessonId Aula.
 * @returns true se concluída.
 */
export async function isLessonCompleted(studentId: number, lessonId: number): Promise<boolean> {
  const row = await prisma.lessonProgress.findUnique({
    where: { studentId_lessonId: { studentId, lessonId } },
    select: { completedAt: true },
  });
  return Boolean(row?.completedAt);
}

/**
 * Guarda a tentativa corrigida (nota e respostas) do aluno logado.
 * Questões abertas ficam sem nota (aguardando correção do professor).
 * @param studentId Aluno.
 * @param activityId Atividade.
 * @param answers Respostas enviadas.
 * @param result Correção feita no servidor.
 */
export async function saveAttempt(
  studentId: number,
  activityId: number,
  answers: Answer[],
  result: GradeResult,
): Promise<void> {
  const byQuestion = new Map(answers.map((a) => [a.questionId, a]));
  // Só guarda opções que existem na própria questão (o navegador pode mandar outra).
  const sentOptions = answers.flatMap((a) => (a.optionId ? [a.optionId] : []));
  const validOptions = new Set(
    (
      await prisma.questionOption.findMany({
        where: { id: { in: sentOptions } },
        select: { id: true, questionId: true },
      })
    ).map((o) => `${o.questionId}:${o.id}`),
  );
  const now = new Date();
  await prisma.activityAttempt.create({
    data: {
      activityId,
      studentId,
      score: result.score,
      maxScore: result.maxScore,
      startedAt: now,
      submittedAt: now,
      answers: {
        create: result.results.map((r) => {
          const answer = byQuestion.get(r.questionId);
          const numeric = answer?.value ? Number(answer.value.replace(",", ".")) : NaN;
          return {
            questionId: r.questionId,
            selectedOptionId:
              answer?.optionId && validOptions.has(`${r.questionId}:${answer.optionId}`)
                ? answer.optionId
                : null,
            // DECIMAL(14,4): fora disso não cabe na coluna.
            numericValue: Number.isFinite(numeric) && Math.abs(numeric) < 1e10 ? numeric : null,
            textValue: answer?.text?.slice(0, 10_000) ?? null,
            isCorrect: r.status === "ungraded" ? null : r.status === "correct",
            pointsAwarded: r.status === "ungraded" ? null : r.points,
          };
        }),
      },
    },
  });
}
