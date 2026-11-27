"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import type { ActionState } from "@/types/action";
import { materialSchema } from "@/validators/media";

/**
 * Cria ou edita um material (PDF enviado ou link). O dono é a disciplina,
 * um módulo ou uma aula: exatamente um (CHECK ck_materials_one_owner).
 */
export async function saveMaterial(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(materialSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ownerType, courseId, moduleId, lessonId, ...fields } = parsed.data;

  // Confere que módulo/aula pertencem à disciplina escolhida.
  if (
    ownerType === "module" &&
    !(await prisma.module.count({ where: { id: moduleId ?? 0, courseId } }))
  ) {
    return { ok: false, fieldErrors: { moduleId: ["Módulo não pertence à disciplina."] } };
  }
  if (
    ownerType === "lesson" &&
    !(await prisma.lesson.count({ where: { id: lessonId ?? 0, topic: { module: { courseId } } } }))
  ) {
    return { ok: false, fieldErrors: { lessonId: ["Aula não pertence à disciplina."] } };
  }

  const owner = {
    courseId: ownerType === "course" ? courseId : null,
    moduleId: ownerType === "module" ? moduleId : null,
    lessonId: ownerType === "lesson" ? lessonId : null,
  };
  // Com PDF enviado, o link fica vazio: o site sempre usa o visualizador com marca d'água.
  const data = { ...owner, ...fields, externalUrl: fields.fileId ? null : fields.externalUrl };

  try {
    if (id) await prisma.material.update({ where: { id }, data });
    else {
      const last = await prisma.material.aggregate({ where: owner, _max: { sortOrder: true } });
      await prisma.material.create({
        data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/materiais");
  return { ok: true, message: "Material salvo." };
}

/** Liga/desliga "grátis" (visível sem login). */
export async function toggleMaterialPreview(id: number, value: boolean): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.material.update({ where: { id }, data: { isPreview: value } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/materiais");
  return { ok: true };
}

/** Remove um material. O arquivo no storage é mantido (pode ser reaproveitado). */
export async function deleteMaterial(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.material.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/materiais");
  return { ok: true };
}
