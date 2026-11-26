"use server";

import { getActivityPage, gradeActivity, type GradeResult } from "@/lib/activity";
import { activitySubmissionSchema } from "@/validators/activity";

/**
 * Corrige a atividade no servidor. A checagem de acesso é refeita aqui
 * (lib/access.ts via getActivityPage): chamar a action direto não libera
 * atividade paga.
 * @param input { activityId, answers }.
 * @returns Nota e resultado por questão, ou erro.
 */
export async function submitActivity(
  input: unknown,
): Promise<{ ok: true; result: GradeResult } | { ok: false; message: string }> {
  const parsed = activitySubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Respostas inválidas." };

  const activity = await getActivityPage(parsed.data.activityId);
  if (!activity) return { ok: false, message: "Atividade não encontrada." };
  if (activity.access === "locked")
    return { ok: false, message: "Esta atividade é para assinantes." };

  try {
    return { ok: true, result: await gradeActivity(activity.id, parsed.data.answers) };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Não foi possível corrigir agora. Tente de novo." };
  }
}
