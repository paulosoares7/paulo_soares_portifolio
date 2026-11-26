"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@portfolio/database";
import { requestAdminPasswordReset, resetAdminPassword } from "@/lib/admin-password-reset";
import { createAdminSession, endCurrentSession, getClientIp } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import { hitRateLimit, resetRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/types/action";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from "@/validators/auth";

// Limite do CLAUDE.md: 5 tentativas a cada 15 min por IP.
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Hash válido de uma senha qualquer: comparar contra ele quando o e-mail não
// existe gasta o mesmo tempo e não revela quais e-mails são cadastrados.
const DUMMY_HASH = "$2b$12$GudHwjGA9g5XEeKUIlJqOeWaMOL9R6xlurLDPnLe2Tc7MHQJ1ugIS";

/**
 * Login do administrador com e-mail e senha (RF22).
 * @param _state Estado anterior (não usado).
 * @param formData E-mail e senha.
 * @returns Erro para o formulário; em caso de sucesso redireciona para o resumo.
 */
export async function login(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(loginSchema, formData);
  if (!parsed.success) return parsed.state;

  const rateKey = `admin-login:${await getClientIp()}`;
  const limit = await hitRateLimit(rateKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterMs / 60000);
    return { ok: false, message: `Muitas tentativas. Tente de novo em ${minutes} min.` };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  const passwordOk = await bcrypt.compare(parsed.data.password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !passwordOk || !admin.isActive) {
    return { ok: false, message: "E-mail ou senha incorretos." };
  }

  await resetRateLimit(rateKey);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createAdminSession(admin.id);
  redirect("/");
}

/** Encerra a sessão atual e volta para o login. */
export async function logout(): Promise<void> {
  await endCurrentSession();
  redirect("/login");
}

/** Mensagem igual para e-mail com e sem conta (não revela quem é admin). */
const RESET_SENT =
  "Se este e-mail for de um administrador, enviamos um link para criar uma nova senha. Ele vale por 1 hora.";

/**
 * Pede o link de redefinição da senha do painel. Limite: 5 pedidos a cada
 * 15 min por IP e por e-mail.
 * @param _state Estado anterior (não usado).
 * @param formData E-mail.
 * @returns Mensagem neutra (ou o aviso de muitas tentativas).
 */
export async function requestPasswordReset(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseForm(forgotPasswordSchema, formData);
  if (!parsed.success) return parsed.state;
  const ip = await getClientIp();
  const byIp = await hitRateLimit(`admin-reset-ip:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  const byEmail = await hitRateLimit(
    `admin-reset-email:${parsed.data.email}`,
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS,
  );
  if (!byIp.allowed || !byEmail.allowed) {
    const minutes = Math.ceil(Math.max(byIp.retryAfterMs, byEmail.retryAfterMs) / 60000);
    return { ok: false, message: `Muitas tentativas. Tente de novo em ${minutes} min.` };
  }
  await requestAdminPasswordReset(parsed.data.email, ip);
  return { ok: true, message: RESET_SENT };
}

/**
 * Grava a nova senha com o token do link (1 hora, uso único) e encerra todas
 * as sessões do admin. Limite: 5 tentativas a cada 15 min por IP.
 * @param _state Estado anterior (não usado).
 * @param formData Token, nova senha e confirmação.
 * @returns Erro para o formulário; em caso de sucesso, vai para o login.
 */
export async function resetPassword(_state: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parseForm(resetPasswordSchema, formData);
  if (!parsed.success) return parsed.state;
  const limit = await hitRateLimit(
    `admin-reset-try:${await getClientIp()}`,
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS,
  );
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterMs / 60000);
    return { ok: false, message: `Muitas tentativas. Tente de novo em ${minutes} min.` };
  }
  const changed = await resetAdminPassword(parsed.data.token, parsed.data.password);
  if (!changed)
    return {
      ok: false,
      message: "Este link é inválido, expirou ou já foi usado. Peça um novo.",
    };
  redirect("/login?senha=alterada");
}
