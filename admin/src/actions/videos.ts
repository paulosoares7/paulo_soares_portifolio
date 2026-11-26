"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { deleteBunnyVideo, getBunnyVideo, isBunnyConfigured } from "@/lib/bunny";
import { parseForm } from "@/lib/form";
import type { ActionState } from "@/types/action";
import { linkLessonSchema, videoLinkSchema, videoTitleSchema } from "@/validators/media";

/** Atualiza a lista de vídeos e as páginas de disciplina (selo "em breve"). */
function revalidateVideos(): void {
  revalidatePath("/videos");
  revalidatePath("/disciplinas", "layout");
}

/** Cria ou edita um vídeo por link (YouTube, Vimeo, MP4). */
export async function saveVideoLink(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(videoLinkSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, title, provider, externalUrl, duration } = parsed.data;

  try {
    if (id) {
      const current = await prisma.video.findUnique({ where: { id }, select: { origin: true } });
      if (current?.origin !== "external")
        return { ok: false, message: "Só vídeos por link podem ter o link alterado." };
      if (provider !== "youtube") {
        // Aula grátis só com YouTube (RN10): não deixa trocar a origem por baixo dela.
        const freeLesson = await prisma.lesson.findFirst({
          where: { videoId: id, isPreview: true },
          select: { title: true },
        });
        if (freeLesson)
          return {
            ok: false,
            message: `Usado na aula grátis "${freeLesson.title}", que precisa de YouTube.`,
          };
      }
      await prisma.video.update({
        where: { id },
        data: { title, provider, externalUrl, durationSeconds: duration },
      });
    } else {
      await prisma.video.create({
        data: {
          title,
          origin: "external",
          provider,
          externalUrl,
          durationSeconds: duration,
          status: "ready",
        },
      });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidateVideos();
  return { ok: true, message: "Vídeo salvo." };
}

/** Renomeia um vídeo hospedado. */
export async function renameVideo(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(videoTitleSchema, formData);
  if (!parsed.success) return parsed.state;
  try {
    await prisma.video.update({
      where: { id: parsed.data.id },
      data: { title: parsed.data.title },
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateVideos();
  return { ok: true, message: "Salvo." };
}

/**
 * Chamado pelo navegador quando o envio TUS termina (ou falha).
 * @param id ID do vídeo no banco.
 * @param uploaded true = arquivo chegou ao Bunny.
 */
export async function finishVideoUpload(id: number, uploaded: boolean): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.video.update({
      where: { id },
      data: { status: uploaded ? "processing" : "failed" },
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateVideos();
  return { ok: true };
}

/**
 * Consulta o Bunny e atualiza status e duração de um vídeo hospedado.
 * @param id ID do vídeo no banco.
 */
export async function refreshVideoStatus(id: number): Promise<ActionState> {
  await requireAdmin();
  if (!isBunnyConfigured()) return { ok: false, message: "Bunny não configurado." };
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video?.providerVideoId || video.provider !== "bunny")
    return { ok: false, message: "Não é um vídeo do Bunny." };
  try {
    const remote = await getBunnyVideo(video.providerVideoId);
    await prisma.video.update({
      where: { id },
      data: {
        status: remote.status,
        durationSeconds: remote.durationSeconds ?? video.durationSeconds,
      },
    });
  } catch (error) {
    return actionError(error, "Não foi possível consultar o Bunny.");
  }
  revalidateVideos();
  return { ok: true };
}

/**
 * Remove o vídeo. As aulas que o usavam passam a "vídeo em breve".
 * Vídeo do Bunny também é apagado lá (se o Bunny estiver configurado).
 */
export async function deleteVideo(id: number): Promise<ActionState> {
  await requireAdmin();
  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return { ok: false, message: "Vídeo não encontrado." };
  try {
    if (video.provider === "bunny" && video.providerVideoId && isBunnyConfigured()) {
      await deleteBunnyVideo(video.providerVideoId).catch((error: unknown) =>
        console.error("Bunny:", error),
      );
    }
    await prisma.video.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidateVideos();
  return { ok: true };
}

/** Vincula um vídeo a uma aula (RF26), respeitando a regra da aula grátis. */
export async function linkVideoToLesson(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(linkLessonSchema, formData);
  if (!parsed.success) return parsed.state;
  const { videoId, lessonId } = parsed.data;

  const [video, lesson] = await Promise.all([
    prisma.video.findUnique({ where: { id: videoId }, select: { provider: true } }),
    prisma.lesson.findUnique({ where: { id: lessonId }, select: { isPreview: true, title: true } }),
  ]);
  if (!video || !lesson) return { ok: false, message: "Vídeo ou aula não encontrados." };
  if (lesson.isPreview && video.provider !== "youtube") {
    return {
      ok: false,
      fieldErrors: { lessonId: ["Esta aula é grátis: use um vídeo do YouTube (RN10)."] },
    };
  }
  try {
    await prisma.lesson.update({ where: { id: lessonId }, data: { videoId } });
  } catch (error) {
    return actionError(error);
  }
  revalidateVideos();
  return { ok: true, message: `Vinculado à aula "${lesson.title}".` };
}

/** Tira o vídeo de uma aula (ela volta a "vídeo em breve"). */
export async function unlinkLessonVideo(lessonId: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.lesson.update({ where: { id: lessonId }, data: { videoId: null } });
  } catch (error) {
    return actionError(error);
  }
  revalidateVideos();
  return { ok: true };
}
