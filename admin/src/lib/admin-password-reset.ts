// "Esqueci a senha" do painel: token aleatório enviado por e-mail, só o
// SHA-256 no banco (admin_password_resets), válido por 1 hora e uso único.
import bcrypt from "bcryptjs";
import { prisma } from "@portfolio/database";
import { adminResetEmail } from "@/lib/auth-emails";
import { randomToken, sha256 } from "@/lib/crypto";
import { deliverMail } from "@/lib/mail";

const RESET_DURATION_MS = 60 * 60 * 1000;
// Mesmo custo do script create-admin.
const BCRYPT_COST = 12;

/** Endereço do painel, usado no link do e-mail. */
export const ADMIN_URL = (process.env.ADMIN_URL || "http://localhost:3001").replace(/\/$/, "");

/**
 * Cria o link de redefinição e envia por e-mail, se o e-mail for de um admin
 * ativo. Não diz nada a quem pediu (a tela responde igual nos dois casos).
 * @param email E-mail digitado.
 * @param ipAddress IP de quem pediu (registro).
 */
export async function requestAdminPasswordReset(email: string, ipAddress: string): Promise<void> {
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !admin.isActive) return;

  const token = randomToken();
  // Um link por vez: os anteriores que não foram usados deixam de valer.
  await prisma.$transaction([
    prisma.adminPasswordReset.deleteMany({ where: { adminUserId: admin.id, usedAt: null } }),
    prisma.adminPasswordReset.create({
      data: {
        adminUserId: admin.id,
        tokenHash: sha256(token),
        ipAddress: ipAddress.slice(0, 45),
        expiresAt: new Date(Date.now() + RESET_DURATION_MS),
      },
    }),
  ]);
  await deliverMail({
    to: admin.email,
    ...adminResetEmail(admin.name, `${ADMIN_URL}/redefinir-senha?token=${token}`),
  });
}

/**
 * Diz se o token ainda vale (existe, não foi usado e não expirou).
 * @param token Token do link.
 * @returns true se pode trocar a senha.
 */
export async function isAdminResetTokenValid(token: string): Promise<boolean> {
  const reset = await prisma.adminPasswordReset.findUnique({
    where: { tokenHash: sha256(token) },
    select: { usedAt: true, expiresAt: true },
  });
  return Boolean(reset && !reset.usedAt && reset.expiresAt > new Date());
}

/**
 * Troca a senha com o token do link: marca o token como usado (uma vez só),
 * grava a nova senha com bcrypt e encerra todas as sessões do admin.
 * @param token Token do link.
 * @param password Nova senha.
 * @returns true se trocou; false se o link é inválido, expirou ou já foi usado.
 */
export async function resetAdminPassword(token: string, password: string): Promise<boolean> {
  const now = new Date();
  const reset = await prisma.adminPasswordReset.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (!reset || reset.usedAt || reset.expiresAt <= now) return false;

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  return prisma.$transaction(async (tx) => {
    // O updateMany com usedAt: null garante o uso único mesmo com dois envios ao mesmo tempo.
    const used = await tx.adminPasswordReset.updateMany({
      where: { id: reset.id, usedAt: null },
      data: { usedAt: now },
    });
    if (used.count !== 1) return false;
    await tx.adminUser.update({ where: { id: reset.adminUserId }, data: { passwordHash } });
    await tx.adminSession.updateMany({
      where: { adminUserId: reset.adminUserId, revokedAt: null },
      data: { revokedAt: now },
    });
    return true;
  });
}
