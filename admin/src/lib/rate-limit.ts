// Limite de tentativas em memória.
// Na Vercel cada instância tem a própria memória, então o limite é por
// instância: freia força bruta casual, mas não substitui um limite global.
// Se precisar de limite global, mover para uma tabela ou um Redis.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Registra uma tentativa e diz se ainda está dentro do limite.
 * @param key Identificador (ex.: "login:203.0.113.5").
 * @param limit Máximo de tentativas na janela.
 * @param windowMs Tamanho da janela em milissegundos.
 * @returns allowed = pode tentar; retryAfterMs = quanto falta para liberar.
 */
export function hitRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, retryAfterMs: bucket.resetAt - now };
}

/**
 * Zera o contador (ex.: depois de um login correto).
 * @param key Mesmo identificador usado em hitRateLimit.
 */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}
