"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import type { ActionState } from "@/types/action";
import {
  degreeSchema,
  experienceSchema,
  highlightSchema,
  profileSchema,
  reorderSchema,
  researchAreaSchema,
  socialLinkSchema,
} from "@/validators/profile";
import { profileLinkSchema } from "@/validators/media";

// Página do painel de cada bloco (o perfil foi dividido em páginas no menu "Portfólio").
const PATHS = {
  profile: "/perfil",
  social: "/redes-sociais",
  career: "/formacao-e-atuacao",
  research: "/areas-de-pesquisa",
} as const;

/**
 * Salva os dados do perfil (linha única id = 1).
 * @param _state Estado anterior.
 * @param formData Campos do perfil.
 * @returns Resultado para o formulário.
 */
export async function saveProfile(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(profileSchema, formData);
  if (!parsed.success) return parsed.state;
  try {
    await prisma.profile.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: parsed.data,
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.profile);
  return { ok: true, message: "Perfil salvo." };
}

/**
 * Define (ou remove) a foto ou o currículo do perfil.
 * @param field "photo" ou "cv".
 * @param mediaFileId ID em media_files, ou null para remover.
 * @returns Resultado.
 */
export async function setProfileFile(
  field: "photo" | "cv",
  mediaFileId: number | null,
): Promise<ActionState> {
  await requireAdmin();
  if (mediaFileId !== null && (!Number.isInteger(mediaFileId) || mediaFileId <= 0)) {
    return { ok: false, message: "Arquivo inválido." };
  }
  const data = field === "photo" ? { photoFileId: mediaFileId } : { cvFileId: mediaFileId };
  try {
    await prisma.profile.update({ where: { id: 1 }, data });
  } catch (error) {
    return actionError(error, "Salve os dados do perfil antes de enviar arquivos.");
  }
  revalidatePath(PATHS.profile);
  return { ok: true };
}

/**
 * Foto ou currículo por link externo (Drive, OneDrive, Dropbox ou site).
 * Vazio remove o link. Na exibição, o arquivo enviado vem antes do link.
 * @param field "photo" ou "cv".
 * @param url Endereço https (ou vazio).
 * @returns Resultado para o formulário.
 */
export async function setProfileLink(field: unknown, url: unknown): Promise<ActionState> {
  await requireAdmin();
  const parsed = profileLinkSchema.safeParse({ field, url: typeof url === "string" ? url : "" });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Link inválido." };
  }
  const data =
    parsed.data.field === "photo" ? { photoUrl: parsed.data.url } : { cvUrl: parsed.data.url };
  try {
    await prisma.profile.update({ where: { id: 1 }, data });
  } catch (error) {
    return actionError(error, "Salve os dados do perfil antes de adicionar links.");
  }
  revalidatePath(PATHS.profile);
  return { ok: true, message: parsed.data.url ? "Link salvo." : "Link removido." };
}

// ---------------------------------------------------------------------
// Listas do perfil. Itens novos entram no fim (maior sort_order + 1).
// ---------------------------------------------------------------------

/** Salva um número de destaque (cria se não houver id). */
export async function saveHighlight(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(highlightSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.profileHighlight.update({ where: { id }, data });
    else {
      const last = await prisma.profileHighlight.aggregate({ _max: { sortOrder: true } });
      await prisma.profileHighlight.create({
        data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.profile);
  return { ok: true, message: "Salvo." };
}

/** Remove um número de destaque. */
export async function deleteHighlight(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.profileHighlight.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.profile);
  return { ok: true };
}

/** Grava a nova ordem dos números de destaque. */
export async function reorderHighlights(ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.profileHighlight.update({ where: { id: itemId }, data: { sortOrder: index + 1 } }),
    ),
  );
  revalidatePath(PATHS.profile);
  return { ok: true };
}

/** Salva um link de rede social. */
export async function saveSocialLink(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(socialLinkSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.socialLink.update({ where: { id }, data });
    else {
      const last = await prisma.socialLink.aggregate({ _max: { sortOrder: true } });
      await prisma.socialLink.create({
        data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.social);
  return { ok: true, message: "Salvo." };
}

/** Remove um link de rede social. */
export async function deleteSocialLink(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.socialLink.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.social);
  return { ok: true };
}

/**
 * Mostra ou oculta um link de rede social no portfólio.
 * @param id Link.
 * @returns Resultado da ação.
 */
export async function toggleSocialLinkVisibility(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    const link = await prisma.socialLink.findUniqueOrThrow({ where: { id } });
    await prisma.socialLink.update({ where: { id }, data: { isVisible: !link.isVisible } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.social);
  return { ok: true };
}

/** Grava a nova ordem das redes sociais. */
export async function reorderSocialLinks(ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.socialLink.update({ where: { id: itemId }, data: { sortOrder: index + 1 } }),
    ),
  );
  revalidatePath(PATHS.social);
  return { ok: true };
}

/** Salva uma formação acadêmica. */
export async function saveDegree(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(degreeSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.academicDegree.update({ where: { id }, data });
    else {
      const last = await prisma.academicDegree.aggregate({ _max: { sortOrder: true } });
      await prisma.academicDegree.create({
        data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.career);
  return { ok: true, message: "Salvo." };
}

/** Remove uma formação acadêmica. */
export async function deleteDegree(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.academicDegree.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.career);
  return { ok: true };
}

/** Grava a nova ordem da formação. */
export async function reorderDegrees(ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.academicDegree.update({ where: { id: itemId }, data: { sortOrder: index + 1 } }),
    ),
  );
  revalidatePath(PATHS.career);
  return { ok: true };
}

/** Salva uma atuação profissional. */
export async function saveExperience(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(experienceSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.experience.update({ where: { id }, data });
    else {
      const last = await prisma.experience.aggregate({ _max: { sortOrder: true } });
      await prisma.experience.create({
        data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.career);
  return { ok: true, message: "Salvo." };
}

/** Remove uma atuação profissional. */
export async function deleteExperience(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.experience.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.career);
  return { ok: true };
}

/** Grava a nova ordem da atuação. */
export async function reorderExperiences(ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.experience.update({ where: { id: itemId }, data: { sortOrder: index + 1 } }),
    ),
  );
  revalidatePath(PATHS.career);
  return { ok: true };
}

/** Salva uma área de pesquisa. */
export async function saveResearchArea(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(researchAreaSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.researchArea.update({ where: { id }, data });
    else {
      const last = await prisma.researchArea.aggregate({ _max: { sortOrder: true } });
      await prisma.researchArea.create({
        data: { ...data, sortOrder: (last._max.sortOrder ?? 0) + 1 },
      });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.research);
  return { ok: true, message: "Salvo." };
}

/** Remove uma área de pesquisa. */
export async function deleteResearchArea(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.researchArea.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATHS.research);
  return { ok: true };
}

/** Grava a nova ordem das áreas de pesquisa. */
export async function reorderResearchAreas(ids: number[]): Promise<ActionState> {
  await requireAdmin();
  const parsed = reorderSchema.safeParse(ids);
  if (!parsed.success) return { ok: false, message: "Ordem inválida." };
  await prisma.$transaction(
    parsed.data.map((itemId, index) =>
      prisma.researchArea.update({ where: { id: itemId }, data: { sortOrder: index + 1 } }),
    ),
  );
  revalidatePath(PATHS.research);
  return { ok: true };
}
