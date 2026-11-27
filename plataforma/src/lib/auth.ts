// Login dos alunos com o Better Auth: Google e/ou e-mail e senha.
// As tabelas são as do projeto database (students, student_accounts,
// student_sessions, auth_verifications, auth_rate_limits); aqui só o mapeamento.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import bcrypt from "bcryptjs";
import { prisma } from "@portfolio/database";
import { existingAccountEmail, resetPasswordEmail, verificationEmail } from "@/lib/auth-emails";
import {
  clearEmailFailures,
  clientIp,
  loginKeys,
  minutesBlocked,
  registerFailure,
} from "@/lib/login-limit";
import { sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/site";

/** Sessões abertas ao mesmo tempo por aluno (a mais antiga cai). */
export const MAX_SESSIONS = 2;
/** Custo do bcrypt (o mesmo da senha do admin). */
const BCRYPT_COST = 12;
const ONE_HOUR = 60 * 60;

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Em desenvolvimento, diz no terminal por que o botão do Google não funciona
// (uma vez, quando o servidor carrega este arquivo). Passo a passo em
// docs/guia-login-google.md.
if (!googleConfigured && process.env.NODE_ENV === "development") {
  const missing = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"].filter((name) => !process.env[name]);
  console.warn(
    `[login] "Entrar com Google" desligado: falta ${missing.join(" e ")} no plataforma/.env.local (veja docs/guia-login-google.md).`,
  );
}

/**
 * Primeiro nome, usado como nome no fórum (display_name) no cadastro.
 * @param name Nome completo.
 * @returns Primeiro nome com no máximo 60 caracteres.
 */
function firstName(name: string): string {
  return (name.trim().split(/\s+/)[0] || "Aluno").slice(0, 60);
}

export const auth = betterAuth({
  appName: "Aulas de Física",
  baseURL: process.env.BETTER_AUTH_URL || SITE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // Em desenvolvimento, aceita também o IP do computador (DEV_HOST no
  // .env.local), para entrar pelo celular na mesma rede Wi-Fi.
  trustedOrigins:
    process.env.NODE_ENV !== "production" && process.env.DEV_HOST
      ? [SITE_URL, `http://${process.env.DEV_HOST}:3002`]
      : [SITE_URL],
  database: prismaAdapter(prisma, { provider: "mysql" }),

  // Nomes dos models do Prisma; os campos já têm os nomes que o Better Auth usa,
  // menos o dono da sessão e da conta (studentId).
  user: {
    modelName: "student",
    additionalFields: {
      displayName: { type: "string", required: false, input: false },
    },
  },
  session: {
    modelName: "studentSession",
    fields: { userId: "studentId" },
    expiresIn: 30 * 24 * ONE_HOUR,
    updateAge: 24 * ONE_HOUR,
  },
  account: {
    modelName: "studentAccount",
    fields: { userId: "studentId" },
    // Tokens do Google guardados criptografados (com BETTER_AUTH_SECRET).
    encryptOAuthTokens: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      // O aluno de cortesia é cadastrado pelo painel com e-mail ainda não
      // confirmado; sem isto, o Google não entraria na conta dele. O risco
      // (alguém cadastrar o e-mail de outra pessoa antes) é tratado no
      // databaseHooks.account.create.after: a senha dessa conta é apagada.
      requireLocalEmailVerified: false,
    },
  },
  verification: {
    modelName: "authVerification",
    // Token de redefinição guardado só como SHA-256.
    storeIdentifier: "hashed",
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    // O bcrypt só usa os primeiros 72 bytes.
    maxPasswordLength: 72,
    // Só entra com senha quem confirmou o e-mail. Também faz o cadastro com
    // e-mail já existente responder igual (não revela quem tem conta).
    requireEmailVerification: true,
    password: {
      hash: (password) => bcrypt.hash(password, BCRYPT_COST),
      verify: ({ hash, password }) => bcrypt.compare(password, hash),
    },
    resetPasswordTokenExpiresIn: ONE_HOUR,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({ to: user.email, ...resetPasswordEmail(user.name, url) });
    },
    onPasswordReset: async ({ user }) => {
      // O link chegou no e-mail: isso confirma o e-mail (ex.: aluno de cortesia).
      await prisma.student.update({
        where: { id: Number(user.id) },
        data: { emailVerified: true },
      });
      await clearEmailFailures(user.email);
    },
    onExistingUserSignUp: async ({ user }) => {
      await sendMail({
        to: user.email,
        ...existingAccountEmail(user.name, `${SITE_URL}/esqueci-a-senha`),
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    // Quem tenta entrar sem ter confirmado recebe o link de novo.
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: ONE_HOUR,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({ to: user.email, ...verificationEmail(user.name, url) });
    },
  },

  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          prompt: "select_account",
        },
      }
    : {},

  // Limites gerais do Better Auth (por IP), guardados no banco. O limite do
  // login (IP + e-mail) é o de lib/login-limit.ts, nos hooks abaixo.
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "authRateLimit",
    window: 60,
    max: 100,
    customRules: {
      "/sign-up/email": { window: 15 * 60, max: 5 },
      "/request-password-reset": { window: 15 * 60, max: 5 },
      "/send-verification-email": { window: 15 * 60, max: 5 },
      "/reset-password": { window: 15 * 60, max: 10 },
    },
  },

  advanced: {
    // students.id é INT AUTO_INCREMENT: o banco gera o ID.
    database: { generateId: "serial" },
    // Cookie Secure em produção (https); httpOnly e SameSite=Lax são o padrão.
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  hooks: {
    // 5 erros de login a cada 15 min por IP e por e-mail.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      const wait = await minutesBlocked(loginKeys(clientIp(ctx.headers), email));
      if (wait > 0)
        throw new APIError("TOO_MANY_REQUESTS", {
          message: `Muitas tentativas. Tente de novo em ${wait} minuto(s).`,
        });
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email : "";
      const returned = ctx.context.returned;
      if (returned instanceof APIError) {
        // Senha certa com e-mail não confirmado e o próprio bloqueio não contam.
        const code = (returned.body as { code?: string } | undefined)?.code;
        if (code === "EMAIL_NOT_VERIFIED" || returned.status === "TOO_MANY_REQUESTS") return;
        await registerFailure(loginKeys(clientIp(ctx.headers), email));
      } else {
        await clearEmailFailures(email);
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        // Nome do fórum = primeiro nome (o aluno pode mudar depois).
        before: async (user) => ({
          data: { ...user, displayName: firstName(user.name) },
        }),
      },
    },
    session: {
      create: {
        // Aluno bloqueado no painel não abre sessão.
        before: async (session) => {
          const student = await prisma.student.findUnique({
            where: { id: Number(session.userId) },
            select: { isBlocked: true },
          });
          if (!student || student.isBlocked) return false;
        },
        // No máximo 2 sessões: apaga as mais antigas.
        after: async (session) => {
          const studentId = Number(session.userId);
          const extra = await prisma.studentSession.findMany({
            where: { studentId },
            orderBy: { createdAt: "desc" },
            skip: MAX_SESSIONS,
            select: { id: true },
          });
          if (extra.length)
            await prisma.studentSession.deleteMany({
              where: { id: { in: extra.map((s) => s.id) } },
            });
          // Entrada registrada para o painel (acessos por dia, RF29).
          await prisma.accessLog.create({
            data: {
              studentId,
              sessionId: Number(session.id),
              event: "login",
              ipAddress: session.ipAddress?.slice(0, 45) || null,
            },
          });
        },
      },
    },
    account: {
      create: {
        // Google entrou numa conta com e-mail ainda não confirmado: o Google
        // provou que o e-mail é desta pessoa. Apaga a senha que existia (pode
        // ter sido cadastrada por outra pessoa) e as sessões, e confirma o e-mail.
        after: async (account) => {
          if (account.providerId !== "google") return;
          const studentId = Number(account.userId);
          const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { emailVerified: true },
          });
          if (!student || student.emailVerified) return;
          await prisma.$transaction([
            prisma.studentAccount.deleteMany({ where: { studentId, providerId: "credential" } }),
            prisma.studentSession.deleteMany({ where: { studentId } }),
            prisma.student.update({ where: { id: studentId }, data: { emailVerified: true } }),
          ]);
        },
      },
    },
  },

  // Permite que Server Actions gravem o cookie da sessão.
  plugins: [nextCookies()],
});

/** Diz se o botão "Entrar com Google" deve aparecer. */
export const isGoogleEnabled = googleConfigured;
