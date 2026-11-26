import { z } from "zod";
import { checkbox, id, optionalId, requiredText } from "@/validators/common";

/** Aviso do professor (tópico do tipo announcement, já visível). */
export const announcementSchema = z.object({
  courseId: id,
  lessonId: optionalId,
  title: requiredText(200),
  body: requiredText(60000),
  isPinned: checkbox,
});

/** Resposta do professor num tópico (entra como visível). */
export const replySchema = z.object({
  threadId: id,
  body: requiredText(60000),
  isAnswer: checkbox,
});
