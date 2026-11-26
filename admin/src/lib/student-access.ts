// Regras de código e sessões do aluno usadas pelo painel.
import { prisma } from "@portfolio/database";
import { generateAccessCode } from "@/lib/access-code";
import { isMailConfigured, sendAccessCodeEmail } from "@/lib/mail";

/**
 * Gera um código novo para o aluno. RN01: um único código ativo por aluno,
 * então os outros são revogados e as sessões deles encerradas.
 * @param studentId Aluno.
 * @returns Código em texto (para mostrar uma vez) e se foi enviado por e-mail.
 */
export async function issueAccessCode(
  studentId: number,
): Promise<{ code: string; emailed: boolean }> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    select: { name: true, email: true },
  });
  const { code, hash, hint } = generateAccessCode();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const others = await tx.accessCode.findMany({
      where: { studentId, status: { not: "revoked" } },
      select: { id: true },
    });
    const otherIds = others.map((c) => c.id);
    if (otherIds.length) {
      await tx.accessCode.updateMany({
        where: { id: { in: otherIds } },
        data: { status: "revoked" },
      });
      await tx.studentSession.updateMany({
        where: { accessCodeId: { in: otherIds }, revokedAt: null },
        data: { revokedAt: now },
      });
    }
    await tx.accessCode.create({ data: { studentId, codeHash: hash, codeHint: hint } });
  });

  let emailed = false;
  if (isMailConfigured()) {
    try {
      await sendAccessCodeEmail(student.email, student.name, code);
      emailed = true;
    } catch (error) {
      console.error("Falha ao enviar o código por e-mail:", error);
    }
  }
  return { code, emailed };
}

/**
 * Encerra todas as sessões abertas de um código.
 * @param accessCodeId Código.
 */
export async function revokeCodeSessions(accessCodeId: number): Promise<void> {
  await prisma.studentSession.updateMany({
    where: { accessCodeId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
