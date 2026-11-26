"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import { issueAccessCode, revokeCodeSessions } from "@/lib/student-access";
import type { ActionState, CodeActionState } from "@/types/action";
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
    if (data.isBlocked) {
      await prisma.studentSession.updateMany({
        where: { accessCode: { studentId: id }, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
  } catch (error) {
    return actionError(error);
  }
  revalidateStudents();
  return { ok: true, message: "Aluno salvo." };
}

/**
 * Gera um código novo (RN01: revoga o anterior e encerra as sessões dele).
 * @param studentId Aluno.
 * @returns Código para mostrar uma única vez.
 */
export async function regenerateCode(studentId: number): Promise<CodeActionState> {
  await requireAdmin();
  try {
    const issued = await issueAccessCode(studentId);
    revalidateStudents();
    return { ok: true, code: issued.code, emailed: issued.emailed };
  } catch (error) {
    return actionError(error, "Não foi possível gerar o código.");
  }
}

/**
 * Suspende, reativa ou revoga um código. Suspender e revogar encerram as sessões.
 * @param accessCodeId Código.
 * @param status Novo status.
 */
export async function setCodeStatus(
  accessCodeId: number,
  status: "active" | "suspended" | "revoked",
): Promise<ActionState> {
  await requireAdmin();
  const code = await prisma.accessCode.findUnique({ where: { id: accessCodeId } });
  if (!code) return { ok: false, message: "Código não encontrado." };
  if (code.status === "revoked")
    return { ok: false, message: "Código revogado não volta; gere um novo." };
  if (status === "active") {
    // RN01: só um código ativo por aluno.
    const otherActive = await prisma.accessCode.count({
      where: { studentId: code.studentId, status: "active", id: { not: code.id } },
    });
    if (otherActive) return { ok: false, message: "O aluno já tem outro código ativo." };
  }
  try {
    await prisma.accessCode.update({ where: { id: accessCodeId }, data: { status } });
    if (status !== "active") await revokeCodeSessions(accessCodeId);
  } catch (error) {
    return actionError(error);
  }
  revalidateStudents();
  return { ok: true };
}

/** Encerra uma sessão (um dispositivo). */
export async function endSession(sessionId: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.studentSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
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
    await prisma.studentSession.updateMany({
      where: { accessCode: { studentId }, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateStudents();
  return { ok: true };
}

/**
 * Anonimiza o aluno a pedido (LGPD, RN14): apaga nome e e-mail, revoga
 * códigos e sessões. Assinaturas e cobranças ficam (registro financeiro).
 */
export async function anonymizeStudent(studentId: number): Promise<ActionState> {
  await requireAdmin();
  const now = new Date();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId },
        data: {
          name: `Aluno removido #${studentId}`,
          displayName: "Anônimo",
          email: `removido-${studentId}@anonimizado.invalid`,
          isBlocked: true,
        },
      });
      await tx.accessCode.updateMany({ where: { studentId }, data: { status: "revoked" } });
      await tx.studentSession.updateMany({
        where: { accessCode: { studentId }, revokedAt: null },
        data: { revokedAt: now, ipAddress: null, userAgent: null },
      });
      await tx.accessLog.updateMany({
        where: { accessCode: { studentId } },
        data: { ipAddress: null },
      });
    });
  } catch (error) {
    return actionError(error);
  }
  revalidateStudents();
  return { ok: true, message: "Aluno anonimizado." };
}
