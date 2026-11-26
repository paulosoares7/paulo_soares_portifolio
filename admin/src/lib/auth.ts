// Sessão do administrador: token aleatório no cookie httpOnly, só o SHA-256
// no banco (admin_sessions).
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@portfolio/database";
import { randomToken, sha256 } from "@/lib/crypto";

/** Nome do cookie da sessão do painel. */
export const SESSION_COOKIE = "admin_session";

// 12 horas: o painel é usado em sessões de trabalho; depois pede login de novo.
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

/** Administrador logado (dados seguros para a interface). */
export type CurrentAdmin = { id: number; name: string; email: string; sessionId: number };

/**
 * IP do cliente a partir dos cabeçalhos do proxy (Vercel ou local).
 * @returns IP ou "local".
 */
export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip") || "local";
}

/**
 * Cria a sessão no banco e grava o cookie. Só pode ser chamada em server action.
 * @param adminUserId ID do administrador autenticado.
 */
export async function createAdminSession(adminUserId: number): Promise<void> {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const headerList = await headers();

  await prisma.adminSession.create({
    data: {
      adminUserId,
      tokenHash: sha256(token),
      ipAddress: (await getClientIp()).slice(0, 45),
      userAgent: headerList.get("user-agent")?.slice(0, 255) ?? null,
      expiresAt,
    },
  });

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true, // navegadores aceitam Secure em http://localhost
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Administrador da sessão atual (uma consulta por requisição, via cache).
 * @returns Admin logado ou null.
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { adminUser: { select: { id: true, name: true, email: true, isActive: true } } },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    !session.adminUser.isActive
  ) {
    return null;
  }
  const { id, name, email } = session.adminUser;
  return { id, name, email, sessionId: session.id };
});

/**
 * Exige sessão válida; sem sessão, manda para o login.
 * Use no layout do painel e no início de TODA server action.
 * @returns Admin logado.
 */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}

/** Revoga a sessão atual e apaga o cookie (logout). */
export async function endCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.adminSession.updateMany({
      where: { tokenHash: sha256(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}
