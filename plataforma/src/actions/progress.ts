"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@portfolio/database";
import { checkAccess, getViewerStudentId } from "@/lib/access";
import { recordLessonView, setLessonCompleted } from "@/lib/progress";

const lessonIdSchema = z.coerce.number().int().positive();

/**
 * Aula que o aluno logado pode abrir, ou null (sem login, sem acesso ou não
 * publicada). A decisão de acesso é a de lib/access.ts.
 * @param lessonId Aula.
 * @returns Aluno e dados da aula.
 */
async function openableLesson(lessonId: unknown) {
  const id = lessonIdSchema.safeParse(lessonId);
  const studentId = await getViewerStudentId();
  if (!id.success || !studentId) return null;
  const lesson = await prisma.lesson.findFirst({
    where: { id: id.data, status: "published" },
    select: {
      id: true,
      isPreview: true,
      videoId: true,
      topic: { select: { module: { select: { courseId: true } } } },
    },
  });
  if (!lesson) return null;
  const access = await checkAccess(
    { isPreview: lesson.isPreview, courseId: lesson.topic.module.courseId },
    studentId,
  );
  return access === "locked" ? null : { studentId, lesson };
}

/**
 * Registra que o aluno abriu a aula (chamado pelo player ao carregar).
 * @param lessonId Aula.
 */
export async function trackLessonView(lessonId: number): Promise<void> {
  const found = await openableLesson(lessonId);
  if (!found) return;
  await recordLessonView(found.studentId, found.lesson.id, found.lesson.videoId !== null);
}

/**
 * Marca ou desmarca a aula como concluída pelo aluno.
 * @param lessonId Aula.
 * @param done true = concluída.
 * @returns ok e o novo estado.
 */
export async function markLessonCompleted(
  lessonId: number,
  done: boolean,
): Promise<{ ok: boolean; done: boolean }> {
  const found = await openableLesson(lessonId);
  if (!found) return { ok: false, done: !done };
  await setLessonCompleted(found.studentId, found.lesson.id, Boolean(done));
  revalidatePath("/minha-area");
  return { ok: true, done: Boolean(done) };
}
