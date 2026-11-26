"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { checkFreeActivityRule } from "@/lib/catalog-rules";
import { parseForm } from "@/lib/form";
import type { ActionState } from "@/types/action";
import { activitySchema, gradeSchema, questionSchema } from "@/validators/activity";

const idList = z.array(z.number().int().positive()).max(1000);

/** Atualiza as telas de atividades. */
function revalidateActivities(): void {
  revalidatePath("/atividades", "layout");
}

/** Cria ou edita uma atividade (RN10: 1 grátis por disciplina). */
export async function saveActivity(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(activitySchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;

  const mod = await prisma.module.findUnique({
    where: { id: data.moduleId },
    select: { courseId: true },
  });
  if (!mod) return { ok: false, fieldErrors: { moduleId: ["Módulo não encontrado."] } };
  if (data.isPreview) {
    const ruleError = await checkFreeActivityRule(mod.courseId, id);
    if (ruleError)
      return { ok: false, message: ruleError, fieldErrors: { isPreview: [ruleError] } };
  }

  let createdId: number | null = null;
  try {
    if (id) await prisma.activity.update({ where: { id }, data });
    else {
      const last = await prisma.activity.aggregate({
        where: { moduleId: data.moduleId },
        _max: { sortOrder: true },
      });
      createdId = (
        await prisma.activity.create({
          data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
        })
      ).id;
    }
  } catch (error) {
    return actionError(error);
  }
  revalidateActivities();
  if (createdId) redirect(`/atividades/${createdId}`);
  return { ok: true, message: "Atividade salva." };
}

/** Remove uma atividade (com questões e tentativas dos alunos). */
export async function deleteActivity(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.activity.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidateActivities();
  redirect("/atividades");
}

/**
 * Cria ou edita uma questão. As alternativas são sincronizadas por ID
 * (editar não apaga a alternativa que um aluno já escolheu).
 */
export async function saveQuestion(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(questionSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, options, ...data } = parsed.data;

  // Campos do gabarito que não se aplicam ao tipo ficam vazios.
  const answerKey =
    data.type === "numeric"
      ? { numericAnswer: data.numericAnswer, tolerancePct: data.tolerancePct ?? 0, unit: data.unit }
      : { numericAnswer: null, tolerancePct: null, unit: null };
  const questionData = { ...data, ...answerKey };
  const keptOptions = data.type === "multiple_choice" ? options : [];

  try {
    await prisma.$transaction(async (tx) => {
      let questionId = id;
      if (questionId) {
        await tx.activityQuestion.update({ where: { id: questionId }, data: questionData });
      } else {
        const last = await tx.activityQuestion.aggregate({
          where: { activityId: data.activityId },
          _max: { sortOrder: true },
        });
        questionId = (
          await tx.activityQuestion.create({
            data: { ...questionData, sortOrder: (last._max.sortOrder ?? 0) + 1 },
          })
        ).id;
      }
      const keepIds = keptOptions
        .map((o) => o.id)
        .filter((value): value is number => value !== null);
      await tx.questionOption.deleteMany({ where: { questionId, id: { notIn: keepIds } } });
      for (const [index, option] of keptOptions.entries()) {
        const optionData = {
          text: option.text,
          isCorrect: option.isCorrect,
          feedback: option.feedback,
          sortOrder: index + 1,
        };
        if (option.id)
          await tx.questionOption.updateMany({
            where: { id: option.id, questionId },
            data: optionData,
          });
        else await tx.questionOption.create({ data: { ...optionData, questionId } });
      }
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateActivities();
  return { ok: true, message: "Questão salva." };
}

/** Remove uma questão. */
export async function deleteQuestion(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.activityQuestion.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidateActivities();
  return { ok: true };
}

/** Grava a ordem das questões de uma atividade. */
export async function reorderQuestions(activityId: number, ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = idList.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.activityQuestion.updateMany({
        where: { id: itemId, activityId },
        data: { sortOrder: index + 1 },
      }),
    ),
  );
  revalidateActivities();
  return { ok: true };
}

/**
 * Corrige uma resposta aberta e recalcula a nota da tentativa
 * (soma dos pontos já atribuídos).
 */
export async function gradeAnswer(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(gradeSchema, formData);
  if (!parsed.success) return parsed.state;
  const { answerId, isCorrect, pointsAwarded } = parsed.data;

  const answer = await prisma.attemptAnswer.findUnique({
    where: { id: answerId },
    include: { question: { select: { points: true, type: true } } },
  });
  if (!answer || answer.question.type !== "open")
    return { ok: false, message: "Resposta não encontrada." };
  if (pointsAwarded > Number(answer.question.points)) {
    return {
      ok: false,
      fieldErrors: { pointsAwarded: [`Máximo ${answer.question.points.toString()} ponto(s).`] },
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.attemptAnswer.update({
        where: { id: answerId },
        data: { isCorrect, pointsAwarded },
      });
      const total = await tx.attemptAnswer.aggregate({
        where: { attemptId: answer.attemptId },
        _sum: { pointsAwarded: true },
      });
      await tx.activityAttempt.update({
        where: { id: answer.attemptId },
        data: { score: total._sum.pointsAwarded ?? 0 },
      });
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateActivities();
  return { ok: true, message: "Correção salva." };
}
