// Limite de tentativas de login: 5 erros a cada 15 minutos por IP e por e-mail.
// Fica no banco (auth_rate_limits) porque na Vercel cada instância tem a sua
// memória. Só os ERROS contam: numa escola com o mesmo IP, os alunos que
// acertam a senha não bloqueiam os colegas. Acertar zera o contador do e-mail.
import { prisma } from "@portfolio/database";

/** Erros permitidos dentro da janela. */
export const LOGIN_MAX_FAILURES = 5;
/** Tamanho da janela, em milissegundos (15 minutos). */
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * IP de quem fez o pedido. Na Vercel o x-forwarded-for é preenchido pela
 * própria plataforma; em desenvolvimento ele não existe e vale "local".
 * @param headers Cabeçalhos do pedido.
 * @returns IP (ou "local").
 */
export function clientIp(headers: Headers | undefined): string {
  const forwarded = headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers?.get("x-real-ip")?.trim() || "local";
}

/**
 * Chaves do contador para o IP e para o e-mail.
 * @param ip IP do pedido.
 * @param email E-mail digitado (normalizado em minúsculas).
 * @returns As duas chaves usadas em auth_rate_limits.
 */
export function loginKeys(ip: string, email: string): string[] {
  return [`login-ip:${ip}`, `login-email:${email.trim().toLowerCase()}`];
}

/**
 * Diz quantos minutos faltam para liberar, se alguma chave estourou o limite.
 * @param keys Chaves do IP e do e-mail.
 * @returns Minutos de espera, ou 0 se pode tentar.
 */
export async function minutesBlocked(keys: string[]): Promise<number> {
  const now = Date.now();
  const rows = await prisma.authRateLimit.findMany({ where: { key: { in: keys } } });
  let waitMs = 0;
  for (const row of rows) {
    // lastRequest guarda o início da janela (o 1º erro).
    const age = now - Number(row.lastRequest);
    if (row.count >= LOGIN_MAX_FAILURES && age < LOGIN_WINDOW_MS)
      waitMs = Math.max(waitMs, LOGIN_WINDOW_MS - age);
  }
  return Math.ceil(waitMs / 60000);
}

/**
 * Soma um erro em cada chave. A janela começa no primeiro erro e, depois de
 * 15 minutos, o contador recomeça.
 * @param keys Chaves do IP e do e-mail.
 */
export async function registerFailure(keys: string[]): Promise<void> {
  const now = Date.now();
  for (const key of keys) {
    const row = await prisma.authRateLimit.findUnique({ where: { key } });
    if (!row) {
      // Dois pedidos ao mesmo tempo podem criar a mesma chave: o upsert evita erro.
      await prisma.authRateLimit.upsert({
        where: { key },
        create: { key, count: 1, lastRequest: BigInt(now) },
        update: { count: { increment: 1 } },
      });
    } else if (now - Number(row.lastRequest) >= LOGIN_WINDOW_MS) {
      await prisma.authRateLimit.update({
        where: { key },
        data: { count: 1, lastRequest: BigInt(now) },
      });
    } else {
      await prisma.authRateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    }
  }
}

/**
 * Zera o contador do e-mail depois de um login certo.
 * @param email E-mail que entrou.
 */
export async function clearEmailFailures(email: string): Promise<void> {
  await prisma.authRateLimit.deleteMany({
    where: { key: `login-email:${email.trim().toLowerCase()}` },
  });
}
