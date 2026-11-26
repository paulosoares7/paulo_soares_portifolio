// Regras do catálogo aplicadas pelo painel (as do banco ficam no banco).
import { prisma } from "@portfolio/database";

/** RN10: até 2 aulas grátis (vídeo do YouTube) e 1 atividade grátis por disciplina. */
export const MAX_FREE_LESSONS = 2;
export const MAX_FREE_ACTIVITIES = 1;

/**
 * Confere a RN10 para uma aula marcada como grátis.
 * @param courseId Disciplina da aula.
 * @param lessonId Aula sendo salva (null se for nova).
 * @param videoId Vídeo escolhido (ou null).
 * @returns Mensagem de erro, ou null se estiver dentro da regra.
 */
export async function checkFreeLessonRule(
  courseId: number,
  lessonId: number | null,
  videoId: number | null,
): Promise<string | null> {
  const freeCount = await prisma.lesson.count({
    where: {
      isPreview: true,
      topic: { module: { courseId } },
      ...(lessonId ? { id: { not: lessonId } } : {}),
    },
  });
  if (freeCount >= MAX_FREE_LESSONS) {
    return `Esta disciplina já tem ${MAX_FREE_LESSONS} aulas grátis (limite da regra RN10).`;
  }
  if (videoId) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: { provider: true },
    });
    if (video && video.provider !== "youtube") {
      return "Aula grátis usa vídeo do YouTube (o vídeo pago do Bunny exige assinatura).";
    }
  }
  return null;
}

/**
 * Confere a RN10 para uma atividade marcada como grátis.
 * @param courseId Disciplina da atividade.
 * @param activityId Atividade sendo salva (null se for nova).
 * @returns Mensagem de erro, ou null.
 */
export async function checkFreeActivityRule(
  courseId: number,
  activityId: number | null,
): Promise<string | null> {
  const freeCount = await prisma.activity.count({
    where: {
      isPreview: true,
      module: { courseId },
      ...(activityId ? { id: { not: activityId } } : {}),
    },
  });
  return freeCount >= MAX_FREE_ACTIVITIES
    ? `Esta disciplina já tem ${MAX_FREE_ACTIVITIES} atividade grátis (limite da regra RN10).`
    : null;
}

/**
 * O endereço da aula no site é /disciplina/[curso]/[módulo]/[aula]; por isso o
 * slug da aula precisa ser único dentro do MÓDULO (o banco só garante por tema).
 * @param moduleId Módulo de destino.
 * @param slug Slug desejado.
 * @param lessonId Aula sendo salva (null se for nova).
 * @returns true se o slug já está em uso no módulo.
 */
export async function lessonSlugTaken(
  moduleId: number,
  slug: string,
  lessonId: number | null,
): Promise<boolean> {
  const count = await prisma.lesson.count({
    where: { slug, topic: { moduleId }, ...(lessonId ? { id: { not: lessonId } } : {}) },
  });
  return count > 0;
}

/**
 * RN14: disciplina que já esteve em alguma assinatura não é apagada, é arquivada.
 * @param courseId Disciplina.
 * @returns true se houver vínculo com assinaturas.
 */
export async function courseHasSubscribers(courseId: number): Promise<boolean> {
  const [slots, changes] = await Promise.all([
    prisma.subscriptionCourse.count({ where: { courseId } }),
    prisma.subscriptionCourseChange.count({
      where: { OR: [{ fromCourseId: courseId }, { toCourseId: courseId }] },
    }),
  ]);
  return slots + changes > 0;
}
