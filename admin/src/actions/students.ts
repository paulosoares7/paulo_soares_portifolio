"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import type { ActionState } from "@/types/action";
import { studentSchema } from "@/validators/subscription";

/** Atualiza as telas de alunos. */
function revalidateStudents(): void {
  revalidatePath("/alunos", "layout");
  revalidatePath("/assinaturas");
}

/** Edita nome, apelido do fórum, e-mail e bloqueio do aluno. */
export async function saveStudent(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(studentSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  const clash = await prisma.student.findFirst({ where: { email: data.email, id: { not: id } } });
  if (clash) return { ok: false, fieldErrors: { email: ["Outro aluno já usa este e-mail."] } };
  try {
    await prisma.student.update({ where: { id }, data });
    // Aluno bloqueado perde as sessões abertas na hora.
    if (data.isBlocked) await prisma.studentSession.deleteMany({ where: { studentId: id } });
  } catch (error) {
    return actionError(error);
  }
  revalidateStudents();
  return { ok: true, message: "Aluno salvo." };
}

// As sessões do aluno são do Better Auth (plataforma): encerrar = apagar a
// linha, como o próprio Better Auth faz no "sair".

/** Encerra uma sessão (um dispositivo). */
export async function endSession(sessionId: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.studentSession.deleteMany({ where: { id: sessionId } });
  } catch (error) {
    return actionError(error);
  }
  revalidateStudents();
  return { ok: true };
}

/** Encerra todas as sessões abertas do aluno. */
export async function endAllSessions(studentId: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.studentSession.deleteMany({ where: { studentId } });
  } catch (error) {
    return actionError(error);
  }
  revalidateStudents();
  return { ok: true };
}

/**
 * Anonimiza o aluno a pedido (LGPD, RN14): apaga nome, e-mail, foto, formas
 * de entrar e sessões. Assinaturas e cobranças ficam (registro financeiro).
 */
export async function anonymizeStudent(studentId: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId },
        data: {
          name: `Aluno removido #${studentId}`,
          displayName: "Anônimo",
          email: `removido-${studentId}@anonimizado.invalid`,
          emailVerified: false,
          image: null,
          isBlocked: true,
        },
      });
      // Sem contas vinculadas, ninguém entra mais nesta conta (nem pelo Google).
      await tx.studentAccount.deleteMany({ where: { studentId } });
      await tx.studentSession.deleteMany({ where: { studentId } });
      await tx.accessLog.updateMany({ where: { studentId }, data: { ipAddress: null } });
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateStudents();
  return { ok: true, message: "Aluno anonimizado." };
}
