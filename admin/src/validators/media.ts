import { z } from "zod";
import { enumValues, MATERIAL_TYPES } from "@/lib/labels";
import {
  checkbox,
  id,
  optionalHttpsLink,
  optionalId,
  optionalText,
  requiredText,
} from "@/validators/common";

/** Duração digitada como "9:56" ou "1:02:03" (opcional) → segundos. */
const optionalDuration = z
  .string()
  .trim()
  .optional()
  .transform((value, ctx) => {
    if (!value) return null;
    const parts = value.split(":").map(Number);
    if (parts.length < 1 || parts.length > 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) {
      ctx.addIssue({ code: "custom", message: "Use mm:ss ou h:mm:ss." });
      return z.NEVER;
    }
    return parts.reduce((total, n) => total * 60 + n, 0);
  });

const URL_RULES = {
  youtube: {
    pattern:
      /^https:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{6,}/i,
    hint: "https://www.youtube.com/watch?v=...",
  },
  vimeo: {
    pattern: /^https:\/\/(www\.|player\.)?vimeo\.com\/(video\/)?\d+/i,
    hint: "https://vimeo.com/123456789",
  },
  mp4: { pattern: /^https:\/\/\S+$/i, hint: "https://.../video.mp4" },
} as const;

/** Vídeo por link externo (YouTube, Vimeo ou MP4). */
export const videoLinkSchema = z
  .object({
    id: optionalId,
    title: requiredText(200),
    provider: z.enum(["youtube", "vimeo", "mp4"], { error: "Escolha a origem." }),
    externalUrl: requiredText(500),
    duration: optionalDuration,
  })
  .superRefine((value, ctx) => {
    const rule = URL_RULES[value.provider];
    if (!rule.pattern.test(value.externalUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["externalUrl"],
        message: `Link inválido. Exemplo: ${rule.hint}`,
      });
    }
  });

/** Renomear vídeo hospedado (o arquivo fica no Bunny). */
export const videoTitleSchema = z.object({ id, title: requiredText(200) });

/** Pedido de envio ao Bunny. */
export const bunnyUploadSchema = z.object({ title: z.string().trim().min(1).max(200) });

/** Vincular um vídeo a uma aula. */
export const linkLessonSchema = z.object({ videoId: id, lessonId: id });

/** Material: pertence a exatamente um dono e tem arquivo OU link (CHECKs do banco). */
export const materialSchema = z
  .object({
    id: optionalId,
    ownerType: z.enum(["course", "module", "lesson"], {
      error: "Escolha onde o material aparece.",
    }),
    courseId: id,
    moduleId: optionalId,
    lessonId: optionalId,
    type: z.enum(enumValues(MATERIAL_TYPES), { error: "Escolha o tipo." }),
    title: requiredText(200),
    description: optionalText(400),
    fileId: optionalId,
    externalUrl: optionalHttpsLink(500),
    isPreview: checkbox,
  })
  .superRefine((value, ctx) => {
    if (value.ownerType === "module" && !value.moduleId) {
      ctx.addIssue({ code: "custom", path: ["moduleId"], message: "Escolha o módulo." });
    }
    if (value.ownerType === "lesson" && !value.lessonId) {
      ctx.addIssue({ code: "custom", path: ["lessonId"], message: "Escolha a aula." });
    }
    if (!value.fileId && !value.externalUrl) {
      ctx.addIssue({
        code: "custom",
        path: ["externalUrl"],
        message: "Envie um arquivo ou cole um link externo.",
      });
    }
  });

/** Foto ou currículo do perfil por link externo (vazio = remove o link). */
export const profileLinkSchema = z.object({
  field: z.enum(["photo", "cv"]),
  url: optionalHttpsLink(500),
});
