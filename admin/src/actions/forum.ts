"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import type { ActionState } from "@/types/action";
import { announcementSchema, replySchema } from "@/validators/forum";

/** Atualiza fila, tópicos e o resumo (contador de pendentes). */
function revalidateForum(): void {
  revalidatePath("/forum", "layout");
  revalidatePath("/");
}

/**
 * Aprova (visible) ou recusa (hidden) um post de aluno. Se for o primeiro
 * post do tópico, o tópico acompanha (o 1º post é o corpo do tópico).
 * @param postId Post.
 * @param status Novo status.
 */
export async function moderatePost(
  postId: number,
  status: "visible" | "hidden",
): Promise<ActionState> {
  await requireAdmin();
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    select: { threadId: true },
  });
  if (!post) return { ok: false, message: "Post não encontrado." };
  const firstPost = await prisma.forumPost.findFirst({
    where: { threadId: post.threadId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.forumPost.update({ where: { id: postId }, data: { status } });
      if (firstPost?.id === postId)
        await tx.forumThread.update({ where: { id: post.threadId }, data: { status } });
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateForum();
  return { ok: true };
}

/** Mostra ou oculta um tópico inteiro. */
export async function setThreadStatus(
  threadId: number,
  status: "visible" | "hidden",
): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.forumThread.update({ where: { id: threadId }, data: { status } });
  } catch (error) {
    return actionError(error);
  }
  revalidateForum();
  return { ok: true };
}

/** Fixa ou desafixa um tópico no topo. */
export async function setThreadPinned(threadId: number, isPinned: boolean): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.forumThread.update({ where: { id: threadId }, data: { isPinned } });
  } catch (error) {
    return actionError(error);
  }
  revalidateForum();
  return { ok: true };
}

/**
 * Marca (ou desmarca) um post como resposta oficial. Numa dúvida, a resposta
 * oficial também marca o tópico como resolvido; só uma por tópico.
 * @param postId Post.
 * @param isAnswer true = resposta oficial.
 */
export async function setOfficialAnswer(postId: number, isAnswer: boolean): Promise<ActionState> {
  await requireAdmin();
  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    include: { thread: { select: { id: true, type: true } } },
  });
  if (!post) return { ok: false, message: "Post não encontrado." };
  if (isAnswer && post.status !== "visible")
    return { ok: false, message: "Aprove o post antes de marcá-lo como resposta oficial." };
  try {
    await prisma.$transaction(async (tx) => {
      if (isAnswer)
        await tx.forumPost.updateMany({
          where: { threadId: post.threadId, isAnswer: true },
          data: { isAnswer: false },
        });
      await tx.forumPost.update({ where: { id: postId }, data: { isAnswer } });
      if (post.thread.type === "question")
        await tx.forumThread.update({
          where: { id: post.threadId },
          data: { isResolved: isAnswer },
        });
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateForum();
  return { ok: true };
}

/** Publica um aviso do professor (já visível; fixado se marcado). */
export async function createAnnouncement(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(announcementSchema, formData);
  if (!parsed.success) return parsed.state;
  const { courseId, lessonId, title, body, isPinned } = parsed.data;
  let threadId: number;
  try {
    const thread = await prisma.forumThread.create({
      data: {
        courseId,
        lessonId,
        type: "announcement",
        title,
        adminUserId: admin.id,
        status: "visible",
        isPinned,
        posts: { create: { adminUserId: admin.id, status: "visible", body } },
      },
    });
    threadId = thread.id;
  } catch (error) {
    return actionError(error);
  }
  revalidateForum();
  redirect(`/forum/${threadId}`);
}

/** Resposta do professor (entra visível; pode já ser a resposta oficial). */
export async function replyAsAdmin(_state: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = parseForm(replySchema, formData);
  if (!parsed.success) return parsed.state;
  const { threadId, body, isAnswer } = parsed.data;
  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: { type: true },
  });
  if (!thread) return { ok: false, message: "Tópico não encontrado." };
  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      if (isAnswer)
        await tx.forumPost.updateMany({
          where: { threadId, isAnswer: true },
          data: { isAnswer: false },
        });
      await tx.forumPost.create({
        data: {
          threadId,
          adminUserId: admin.id,
          status: "visible",
          body,
          isAnswer,
          createdAt: now,
        },
      });
      await tx.forumThread.update({
        where: { id: threadId },
        data: {
          lastPostAt: now,
          ...(isAnswer && thread.type === "question" ? { isResolved: true } : {}),
        },
      });
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateForum();
  return { ok: true, message: "Resposta publicada." };
}

/** Apaga um tópico (avisos do professor ou spam). */
export async function deleteThread(threadId: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.forumThread.delete({ where: { id: threadId } });
  } catch (error) {
    return actionError(error);
  }
  revalidateForum();
  redirect("/forum");
}
