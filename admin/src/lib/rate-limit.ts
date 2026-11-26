// Limite de tentativas guardado no banco (auth_rate_limits, a mesma tabela dos
// limites da plataforma, com chaves "admin-..."). Na Vercel cada instância tem
// a própria memória; no banco o limite vale para todas.
import { prisma } from "@portfolio/database";

/**
 * Registra uma tentativa e diz se ainda está dentro do limite. A janela
 * começa na primeira tentativa e recomeça depois de windowMs.
 * @param key Identificador (ex.: "admin-login:203.0.113.5").
 * @param limit Máximo de tentativas na janela.
 * @param windowMs Tamanho da janela em milissegundos.
 * @returns allowed = pode tentar; retryAfterMs = quanto falta para liberar.
 */
export async function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const now = Date.now();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });
  // lastRequest guarda o início da janela.
  if (!row || now - Number(row.lastRequest) >= windowMs) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { key, count: 1, lastRequest: BigInt(now) },
      update: { count: 1, lastRequest: BigInt(now) },
    });
    return { allowed: true, retryAfterMs: 0 };
  }
  const updated = await prisma.authRateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return {
    allowed: updated.count <= limit,
    retryAfterMs: Number(row.lastRequest) + windowMs - now,
  };
}

/**
 * Zera o contador (ex.: depois de um login correto).
 * @param key Mesmo identificador usado em hitRateLimit.
 */
export async function resetRateLimit(key: string): Promise<void> {
  await prisma.authRateLimit.deleteMany({ where: { key } });
}
