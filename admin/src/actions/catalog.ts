"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { checkFreeLessonRule, courseHasSubscribers, lessonSlugTaken } from "@/lib/catalog-rules";
import { parseForm } from "@/lib/form";
import type { ActionState } from "@/types/action";
import {
  categorySchema,
  courseSchema,
  lessonSchema,
  moduleSchema,
  topicSchema,
} from "@/validators/catalog";

const idList = z.array(z.number().int().positive()).max(1000);
const positiveId = z.number().int().positive();

/** Atualiza todas as telas do catálogo (lista e páginas de cada disciplina). */
function revalidateCatalog(): void {
  revalidatePath("/categorias");
  revalidatePath("/disciplinas", "layout");
}

// ---------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------

/** Cria ou edita uma categoria (seção do catálogo). */
export async function saveCategory(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(categorySchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;

  const clash = await prisma.category.findFirst({
    where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) },
  });
  if (clash)
    return { ok: false, fieldErrors: { slug: ["Já existe uma categoria com este endereço."] } };

  try {
    if (id) await prisma.category.update({ where: { id }, data });
    else {
      const last = await prisma.category.aggregate({ _max: { sortOrder: true } });
      await prisma.category.create({
        data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidateCatalog();
  return { ok: true, message: "Categoria salva." };
}

/** Remove uma categoria sem disciplinas. */
export async function deleteCategory(id: number): Promise<ActionState> {
  await requireAdmin();
  if ((await prisma.course.count({ where: { categoryId: id } })) > 0) {
    return { ok: false, message: "Mova ou remova as disciplinas desta categoria antes." };
  }
  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidateCatalog();
  return { ok: true };
}

/** Grava a ordem das categorias. */
export async function reorderCategories(ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = idList.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.category.update({ where: { id: itemId }, data: { sortOrder: index + 1 } }),
    ),
  );
  revalidateCatalog();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Disciplinas
// ---------------------------------------------------------------------

/** Cria ou edita uma disciplina. Na criação, abre a página dela. */
export async function saveCourse(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(courseSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;

  const clash = await prisma.course.findFirst({
    where: { slug: data.slug, ...(id ? { id: { not: id } } : {}) },
  });
  if (clash)
    return { ok: false, fieldErrors: { slug: [`Endereço já usado por "${clash.title}".`] } };

  let createdId: number | null = null;
  try {
    if (id) {
      const current = await prisma.course.findUnique({
        where: { id },
        select: { categoryId: true },
      });
      const movedCategory = current && current.categoryId !== data.categoryId;
      const last = movedCategory
        ? await prisma.course.aggregate({
            where: { categoryId: data.categoryId },
            _max: { sortOrder: true },
          })
        : null;
      await prisma.course.update({
        where: { id },
        data: { ...data, ...(last ? { sortOrder: (last._max.sortOrder ?? 0) + 1 } : {}) },
      });
    } else {
      const last = await prisma.course.aggregate({
        where: { categoryId: data.categoryId },
        _max: { sortOrder: true },
      });
      createdId = (
        await prisma.course.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 } })
      ).id;
    }
  } catch (error) {
    return actionError(error);
  }
  revalidateCatalog();
  if (createdId) redirect(`/disciplinas/${createdId}`);
  return { ok: true, message: "Disciplina salva." };
}

/**
 * Define ou remove a capa da disciplina.
 * @param courseId Disciplina.
 * @param mediaFileId Arquivo enviado (ou null).
 */
export async function setCourseCover(
  courseId: number,
  mediaFileId: number | null,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.course.update({ where: { id: courseId }, data: { coverFileId: mediaFileId } });
  } catch (error) {
    return actionError(error);
  }
  revalidateCatalog();
  return { ok: true };
}

/** Remove uma disciplina. Com assinantes, só pode ser arquivada (RN14). */
export async function deleteCourse(id: number): Promise<ActionState> {
  await requireAdmin();
  if (await courseHasSubscribers(id)) {
    return {
      ok: false,
      message: "Esta disciplina já esteve em assinaturas: arquive-a em vez de apagar (RN14).",
    };
  }
  try {
    await prisma.course.delete({ where: { id } });
  } catch (error) {
    return actionError(error, "Não foi possível apagar. Remova antes os materiais vinculados.");
  }
  revalidateCatalog();
  redirect("/disciplinas");
}

/**
 * Grava a ordem das disciplinas dentro de uma categoria.
 * @param categoryId Categoria (garante que só itens dela sejam alterados).
 * @param ids IDs na nova ordem.
 */
export async function reorderCourses(categoryId: number, ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = idList.safeParse(ids);
  if (!parsed.success || !positiveId.safeParse(categoryId).success)
    return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.course.updateMany({
        where: { id: itemId, categoryId },
        data: { sortOrder: index + 1 },
      }),
    ),
  );
  revalidateCatalog();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Módulos
// ---------------------------------------------------------------------

/** Cria ou edita um módulo. */
export async function saveModule(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(moduleSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;

  const clash = await prisma.module.findFirst({
    where: { courseId: data.courseId, slug: data.slug, ...(id ? { id: { not: id } } : {}) },
  });
  if (clash)
    return {
      ok: false,
      fieldErrors: { slug: ["Já existe um módulo com este endereço nesta disciplina."] },
    };

  try {
    if (id)
      await prisma.module.update({
        where: { id },
        data: {
          slug: data.slug,
          title: data.title,
          description: data.description,
          status: data.status,
        },
      });
    else {
      const last = await prisma.module.aggregate({
        where: { courseId: data.courseId },
        _max: { sortOrder: true },
      });
      await prisma.module.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidateCatalog();
  return { ok: true, message: "Módulo salvo." };
}

/** Remove um módulo (e seus temas e aulas). */
export async function deleteModule(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.module.delete({ where: { id } });
  } catch (error) {
    return actionError(
      error,
      "Não foi possível apagar. Remova antes os materiais do módulo e das aulas.",
    );
  }
  revalidateCatalog();
  return { ok: true };
}

/** Grava a ordem dos módulos de uma disciplina. */
export async function reorderModules(courseId: number, ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = idList.safeParse(ids);
  if (!parsed.success || !positiveId.safeParse(courseId).success)
    return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.module.updateMany({ where: { id: itemId, courseId }, data: { sortOrder: index + 1 } }),
    ),
  );
  revalidateCatalog();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Temas
// ---------------------------------------------------------------------

/** Cria ou edita um tema. */
export async function saveTopic(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(topicSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  try {
    if (id)
      await prisma.topic.update({
        where: { id },
        data: { title: data.title, description: data.description },
      });
    else {
      const last = await prisma.topic.aggregate({
        where: { moduleId: data.moduleId },
        _max: { sortOrder: true },
      });
      await prisma.topic.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidateCatalog();
  return { ok: true, message: "Tema salvo." };
}

/** Remove um tema (e suas aulas). */
export async function deleteTopic(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.topic.delete({ where: { id } });
  } catch (error) {
    return actionError(error, "Não foi possível apagar. Remova antes os materiais das aulas.");
  }
  revalidateCatalog();
  return { ok: true };
}

/** Grava a ordem dos temas de um módulo. */
export async function reorderTopics(moduleId: number, ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = idList.safeParse(ids);
  if (!parsed.success || !positiveId.safeParse(moduleId).success)
    return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.topic.updateMany({ where: { id: itemId, moduleId }, data: { sortOrder: index + 1 } }),
    ),
  );
  revalidateCatalog();
  return { ok: true };
}

// ---------------------------------------------------------------------
// Aulas
// ---------------------------------------------------------------------

/** Cria ou edita uma aula (com as regras de slug e de aula grátis). */
export async function saveLesson(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(lessonSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;

  const topic = await prisma.topic.findUnique({
    where: { id: data.topicId },
    include: { module: { select: { id: true, courseId: true } } },
  });
  if (!topic) return { ok: false, message: "Tema não encontrado." };

  if (await lessonSlugTaken(topic.module.id, data.slug, id)) {
    return {
      ok: false,
      fieldErrors: { slug: ["Já existe uma aula com este endereço neste módulo."] },
    };
  }
  if (data.isPreview) {
    const ruleError = await checkFreeLessonRule(topic.module.courseId, id, data.videoId);
    if (ruleError)
      return { ok: false, fieldErrors: { isPreview: [ruleError] }, message: ruleError };
  }

  try {
    if (id) {
      const current = await prisma.lesson.findUnique({ where: { id }, select: { topicId: true } });
      const movedTopic = current && current.topicId !== data.topicId;
      const last = movedTopic
        ? await prisma.lesson.aggregate({
            where: { topicId: data.topicId },
            _max: { sortOrder: true },
          })
        : null;
      await prisma.lesson.update({
        where: { id },
        data: { ...data, ...(last ? { sortOrder: (last._max.sortOrder ?? 0) + 1 } : {}) },
      });
    } else {
      const last = await prisma.lesson.aggregate({
        where: { topicId: data.topicId },
        _max: { sortOrder: true },
      });
      await prisma.lesson.create({ data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidateCatalog();
  revalidatePath("/videos");
  return { ok: true, message: "Aula salva." };
}

/** Remove uma aula (o progresso dos alunos nela também é apagado). */
export async function deleteLesson(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.lesson.delete({ where: { id } });
  } catch (error) {
    return actionError(error, "Não foi possível apagar. Remova antes os materiais da aula.");
  }
  revalidateCatalog();
  return { ok: true };
}

/** Grava a ordem das aulas de um tema. */
export async function reorderLessons(topicId: number, ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = idList.safeParse(ids);
  if (!parsed.success || !positiveId.safeParse(topicId).success)
    return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.lesson.updateMany({ where: { id: itemId, topicId }, data: { sortOrder: index + 1 } }),
    ),
  );
  revalidateCatalog();
  return { ok: true };
}
