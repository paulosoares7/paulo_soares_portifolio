"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import type { ActionState } from "@/types/action";

/**
 * Marca uma mensagem de contato como lida ou não lida.
 * @param id ID da mensagem.
 * @param read true = lida.
 * @returns Resultado.
 */
export async function setMessageRead(id: number, read: boolean): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.contactMessage.update({
      where: { id },
      data: { readAt: read ? new Date() : null },
    });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath("/mensagens");
  revalidatePath("/");
  return { ok: true };
}
