"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { cancelAsaasSubscription, isAsaasConfigured } from "@/lib/asaas";
import { requireAdmin } from "@/lib/auth";
import { checkCourtesy, grantCourtesy } from "@/lib/courtesy";
import { parseForm } from "@/lib/form";
import { sendStudentResetLink } from "@/lib/student-auth";
import {
  anonymizeStudentData,
  deleteStudentData,
  getStudentFootprint,
  mustAnonymize,
} from "@/lib/student-removal";
import type { ActionState } from "@/types/action";
import { deleteStudentSchema, newStudentSchema, studentSchema } from "@/validators/subscription";

/** Atualiza as telas de alunos. */
function revalidateStudents(): void {
  revalidatePath("/alunos", "layout");
  revalidatePath("/assinaturas");
}

/**
 * Cadastra um aluno pelo painel, com cortesia opcional (dias e disciplinas) e
 * convite por e-mail para criar a senha (ou entrar com o Google).
 */
export async function createStudent(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(newStudentSchema, formData);
  if (!parsed.success) return parsed.state;
  const { name, displayName, email, sendInvite, courtesy, planId, days } = parsed.data;
  const courseIds = [...new Set(parsed.data.courseIds)];

  if (await prisma.student.findUnique({ where: { email }, select: { id: true } })) {
    return { ok: false, fieldErrors: { email: ["Já existe um aluno com este e-mail."] } };
  }
  if (courtesy && planId) {
    const problem = await checkCourtesy({ studentId: null, planId, courseIds });
    if (problem) return problem;
  }

  let studentId: number;
  try {
    studentId = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          name,
          // Mesmo padrão do cadastro na plataforma: primeiro nome no fórum.
          displayName: displayName ?? (name.split(/\s+/)[0] || "Aluno").slice(0, 60),
          email,
        },
      });
      if (courtesy && planId && days) {
        await grantCourtesy(tx, { studentId: student.id, planId, days, courseIds });
      }
      return student.id;
    });
  } catch (error) {
    return actionError(error, "Não foi possível cadastrar o aluno.");
  }
  revalidateStudents();

  if (!sendInvite) return { ok: true, message: "Aluno cadastrado (sem convite)." };
  try {
    const delivery = await sendStudentResetLink(email, "invite");
    const sent =
      delivery === "sent"
        ? `Convite enviado para ${email}.`
        : delivery === "logged"
          ? "Resend não configurado: o convite apareceu no terminal do painel."
          : "E-mail não configurado: o convite não foi enviado.";
    return { ok: true, message: `Aluno cadastrado (#${studentId}). ${sent}` };
  } catch (error) {
    console.error(error);
    return {
      ok: true,
      message: "Aluno cadastrado, mas o convite falhou. Envie o link de senha pela página dele.",
    };
  }
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
 * Exclui o aluno (confirmação digitando o e-mail). Sem histórico, apaga de
 * vez; com cobranças, posts ou histórico, anonimiza (LGPD, RN14) e cancela no
 * Asaas as assinaturas que ainda cobram.
 */
export async function deleteStudent(_state: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(deleteStudentSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, confirmEmail } = parsed.data;
  const student = await prisma.student.findUnique({ where: { id }, select: { email: true } });
  if (!student) return { ok: false, message: "Aluno não encontrado." };
  if (confirmEmail !== student.email.toLowerCase()) {
    return { ok: false, fieldErrors: { confirmEmail: ["O e-mail digitado não confere."] } };
  }

  const footprint = await getStudentFootprint(id);
  const anonymize = mustAnonymize(footprint);
  if (footprint.activeAsaasIds.length) {
    // Sem cancelar no Asaas, a cobrança continuaria saindo do cartão/Pix do aluno.
    if (!isAsaasConfigured()) {
      return {
        ok: false,
        message:
          "O aluno tem assinatura ativa no Asaas e o ASAAS_API_KEY não está configurado. Cancele no painel do Asaas antes.",
      };
    }
    try {
      for (const gatewayId of footprint.activeAsaasIds) await cancelAsaasSubscription(gatewayId);
    } catch (error) {
      return actionError(
        error,
        "Não foi possível cancelar a assinatura no Asaas. Nada foi apagado.",
      );
    }
  }

  try {
    await prisma.$transaction((tx) =>
      anonymize ? anonymizeStudentData(tx, id) : deleteStudentData(tx, id),
    );
  } catch (error) {
    return actionError(error, "Não foi possível excluir o aluno.");
  }
  revalidateStudents();
  if (anonymize) return { ok: true, message: "Aluno anonimizado." };
  redirect("/alunos");
}

/**
 * Envia ao aluno o link para criar ou trocar a senha da plataforma (1 hora,
 * uso único). Ao salvar a nova senha, as sessões dele são encerradas.
 * @param studentId Aluno.
 * @returns Resultado da ação.
 */
export async function sendPasswordResetLink(studentId: number): Promise<ActionState> {
  await requireAdmin();
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { email: true, isBlocked: true },
  });
  if (!student || student.email.endsWith("@anonimizado.invalid"))
    return { ok: false, message: "Aluno não encontrado." };
  if (student.isBlocked)
    return { ok: false, message: "Desbloqueie o aluno antes de enviar o link." };
  try {
    const delivery = await sendStudentResetLink(student.email);
    if (delivery === "unavailable")
      return { ok: false, message: "E-mail não configurado (RESEND_API_KEY e MAIL_FROM)." };
    return {
      ok: true,
      message:
        delivery === "sent"
          ? `Link enviado para ${student.email}.`
          : "Resend não configurado: o link apareceu no terminal do painel.",
    };
  } catch (error) {
    return actionError(error);
  }
}
