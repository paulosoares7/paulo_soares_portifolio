import { z } from "zod";

/** Envio de respostas de uma atividade (JSON vindo do componente cliente). */
export const activitySubmissionSchema = z.object({
  activityId: z.number().int().positive(),
  answers: z
    .array(
      z.object({
        questionId: z.number().int().positive(),
        optionId: z.number().int().positive().nullable().optional(),
        value: z.string().trim().max(40).nullable().optional(),
        text: z.string().trim().max(5000).nullable().optional(),
      }),
    )
    .max(200),
});
