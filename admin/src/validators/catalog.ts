import { z } from "zod";
import { CONTENT_STATUSES, COURSE_STATUSES, enumValues } from "@/lib/labels";
import { checkbox, id, optionalId, optionalText, requiredText, slug } from "@/validators/common";

/** Seção do catálogo (Vestibulares, Ensino Médio...). */
export const categorySchema = z.object({
  id: optionalId,
  slug: slug.max(80, "Máximo de 80 caracteres."),
  name: requiredText(100),
  description: optionalText(300),
});

/** Disciplina ou preparatório. */
export const courseSchema = z.object({
  id: optionalId,
  categoryId: id,
  slug,
  title: requiredText(150),
  shortDescription: requiredText(300),
  description: optionalText(60000),
  icon: optionalText(40),
  color: optionalText(7).refine(
    (v) => v === null || /^#[0-9a-fA-F]{6}$/.test(v),
    "Cor no formato #0EA5E9.",
  ),
  status: z.enum(enumValues(COURSE_STATUSES)),
});

/** Módulo de uma disciplina. */
export const moduleSchema = z.object({
  id: optionalId,
  courseId: id,
  slug,
  title: requiredText(150),
  description: optionalText(60000),
  status: z.enum(enumValues(CONTENT_STATUSES)),
});

/** Tema dentro de um módulo. */
export const topicSchema = z.object({
  id: optionalId,
  moduleId: id,
  title: requiredText(150),
  description: optionalText(400),
});

/** Aula. Campos de conteúdo são opcionais na criação rápida. */
export const lessonSchema = z.object({
  id: optionalId,
  topicId: id,
  videoId: optionalId,
  slug,
  title: requiredText(200),
  summary: optionalText(400),
  content: optionalText(60000),
  isPreview: checkbox,
  status: z.enum(enumValues(CONTENT_STATUSES)),
});
