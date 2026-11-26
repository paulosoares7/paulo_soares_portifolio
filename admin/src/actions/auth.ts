"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@portfolio/database";
import { createAdminSession, endCurrentSession, getClientIp } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import { hitRateLimit, resetRateLimit } from "@/lib/rate-limit";
import type { ActionState } from "@/types/action";
import { loginSchema } from "@/validators/auth";

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

  const rateKey = `login:${await getClientIp()}`;
  const limit = hitRateLimit(rateKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterMs / 60000);
    return { ok: false, message: `Muitas tentativas. Tente de novo em ${minutes} min.` };
  }

  const admin = await prisma.adminUser.findUnique({ where: { email: parsed.data.email } });
  const passwordOk = await bcrypt.compare(parsed.data.password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !passwordOk || !admin.isActive) {
    return { ok: false, message: "E-mail ou senha incorretos." };
  }

  resetRateLimit(rateKey);
  await prisma.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  await createAdminSession(admin.id);
  redirect("/");
}

/** Encerra a sessão atual e volta para o login. */
export async function logout(): Promise<void> {
  await endCurrentSession();
  redirect("/login");
}
