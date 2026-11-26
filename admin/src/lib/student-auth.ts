// Instância mínima do Better Auth no painel, só para gerar o link de
// redefinição de senha de um aluno. O link é aberto na plataforma, que confere
// o token: por isso o mapeamento das tabelas e o formato do token (hash) têm
// de ser IGUAIS aos de plataforma/src/lib/auth.ts.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@portfolio/database";
import { studentResetEmail } from "@/lib/auth-emails";
import { deliverMail, isMailConfigured } from "@/lib/mail";

/** Endereço da plataforma de aulas (onde o aluno abre o link). */
export const PLATAFORMA_URL = (process.env.PLATAFORMA_URL || "http://localhost:3002").replace(
  /\/$/,
  "",
);

const studentAuth = betterAuth({
  baseURL: PLATAFORMA_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [PLATAFORMA_URL],
  database: prismaAdapter(prisma, { provider: "mysql" }),
  user: { modelName: "student" },
  session: { modelName: "studentSession", fields: { userId: "studentId" } },
  account: { modelName: "studentAccount", fields: { userId: "studentId" } },
  verification: { modelName: "authVerification", storeIdentifier: "hashed" },
  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    sendResetPassword: async ({ user, url }) => {
      await deliverMail({ to: user.email, ...studentResetEmail(user.name, url) });
    },
  },
  advanced: { database: { generateId: "serial" } },
});

/**
 * Envia ao aluno o link para criar ou trocar a senha (1 hora, uso único). Serve
 * também para o aluno de cortesia, que ainda não tem senha.
 * @param email E-mail do aluno.
 * @returns Como o e-mail saiu: enviado, só no terminal (desenvolvimento) ou
 * indisponível (sem Resend em produção).
 */
export async function sendStudentResetLink(
  email: string,
): Promise<"sent" | "logged" | "unavailable"> {
  // Em produção sem Resend o link não chegaria: nem cria o token.
  if (!isMailConfigured() && process.env.NODE_ENV === "production") return "unavailable";
  await studentAuth.api.requestPasswordReset({
    body: { email, redirectTo: "/redefinir-senha" },
  });
  return isMailConfigured() ? "sent" : "logged";
}
