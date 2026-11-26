// Instância mínima do Better Auth no painel, só para gerar o link de
// redefinição de senha de um aluno. O link é aberto na plataforma, que confere
// o token: por isso o mapeamento das tabelas e o formato do token (hash) têm
// de ser IGUAIS aos de plataforma/src/lib/auth.ts.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@portfolio/database";
import { studentInviteEmail, studentResetEmail } from "@/lib/auth-emails";
import { deliverMail, isMailConfigured } from "@/lib/mail";

/** Endereço da plataforma de aulas (onde o aluno abre o link). */
export const PLATAFORMA_URL = (process.env.PLATAFORMA_URL || "http://localhost:3002").replace(
  /\/$/,
  "",
);

/**
 * Better Auth com as mesmas tabelas da plataforma; muda só o e-mail enviado e
 * a validade do link.
 * @param email Monta o e-mail com o nome do aluno e o link.
 * @param expiresIn Validade do link em segundos.
 */
function createStudentAuth(
  email: (name: string, url: string) => { subject: string; text: string; html: string },
  expiresIn: number,
) {
  return betterAuth({
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
      resetPasswordTokenExpiresIn: expiresIn,
      sendResetPassword: async ({ user, url }) => {
        await deliverMail({ to: user.email, ...email(user.name, url) });
      },
    },
    advanced: { database: { generateId: "serial" } },
  });
}

const ONE_HOUR = 60 * 60;
/** Validade do convite: o aluno pode demorar a abrir o e-mail. */
export const INVITE_DAYS = 7;

const resetAuth = createStudentAuth(studentResetEmail, ONE_HOUR);
const inviteAuth = createStudentAuth(studentInviteEmail, INVITE_DAYS * 24 * ONE_HOUR);

/**
 * Envia ao aluno o link para criar ou trocar a senha (uso único): 1 hora na
 * redefinição, 7 dias no convite de aluno novo.
 * @param email E-mail do aluno.
 * @param kind "reset" (redefinir) ou "invite" (convite para criar a senha).
 * @returns Como o e-mail saiu: enviado, só no terminal (desenvolvimento) ou
 * indisponível (sem Resend em produção).
 */
export async function sendStudentResetLink(
  email: string,
  kind: "reset" | "invite" = "reset",
): Promise<"sent" | "logged" | "unavailable"> {
  // Em produção sem Resend o link não chegaria: nem cria o token.
  if (!isMailConfigured() && process.env.NODE_ENV === "production") return "unavailable";
  const auth = kind === "invite" ? inviteAuth : resetAuth;
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: "/redefinir-senha" },
  });
  return isMailConfigured() ? "sent" : "logged";
}
