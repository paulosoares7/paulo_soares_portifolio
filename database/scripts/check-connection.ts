// =====================================================================
// Testa a conexão com o banco da DATABASE_URL pelo mesmo caminho dos apps
// (Prisma + driver mariadb, com TLS quando a URL tem ?sslaccept=strict).
// Mostra a causa real quando falha. Nunca imprime a URL nem a senha.
//
// Uso (banco online):
//   export DATABASE_URL='...'   (no seu terminal)
//   npm run db:check
// =====================================================================
import "dotenv/config";
import { createConnection } from "mariadb";
import { connectionOptions, prisma } from "../src/index";

type ErrorWithCause = { message?: string; code?: string; cause?: unknown; meta?: unknown };

/**
 * Junta as mensagens do erro e das causas internas (o erro do Prisma
 * esconde a causa do driver, como senha errada ou certificado).
 * @param error Erro capturado.
 * @returns Linhas com as mensagens, da mais externa à mais interna.
 */
function causes(error: unknown): string[] {
  const lines: string[] = [];
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];
  while (queue.length) {
    const item = queue.shift() as ErrorWithCause | undefined;
    if (!item || typeof item !== "object" || seen.has(item)) continue;
    seen.add(item);
    if (item.message) lines.push(`${item.code ? `[${item.code}] ` : ""}${item.message.trim()}`);
    queue.push(item.cause);
    if (item.meta && typeof item.meta === "object") queue.push(...Object.values(item.meta));
  }
  return [...new Set(lines)];
}

/** Conecta, mostra versão, banco e tabelas, ou a causa do erro. */
async function main(): Promise<void> {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL não definida. Use: export DATABASE_URL='...'");
  const url = new URL(raw);
  console.log(`Servidor: ${url.hostname}:${url.port || 3306}`);
  console.log(`Banco: ${url.pathname.slice(1) || "(nenhum)"}`);
  console.log(
    `Criptografia (TLS): ${url.searchParams.get("sslaccept") === "strict" ? "ligada" : "desligada"}`,
  );
  // 1º passo: o driver direto, com as mesmas opções dos apps. O pool do
  // Prisma esconde a causa ("pool failed to retrieve a connection"); aqui ela
  // aparece (senha errada, banco inexistente, certificado, rede...).
  try {
    const options = connectionOptions(raw);
    const connection = await createConnection({ ...options, connectTimeout: 15000 });
    await connection.end();
  } catch (error) {
    console.error("\nNão conectou. Causa:");
    for (const line of causes(error)) console.error(`  - ${line}`);
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  // 2º passo: pelo Prisma, como os apps fazem.
  try {
    const [info] = await prisma.$queryRaw<{ version: string; db: string | null }[]>`
      SELECT VERSION() AS version, DATABASE() AS db`;
    const tables = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*) AS n FROM information_schema.tables WHERE table_schema = DATABASE()`;
    const count = Number(tables[0]?.n ?? 0);
    console.log(`\nConexão OK. Versão: ${info?.version}. Banco: ${info?.db}.`);
    console.log(
      count
        ? `Tabelas no banco: ${count}.`
        : "O banco está vazio: rode `npx prisma migrate deploy`.",
    );
  } catch (error) {
    console.error("\nNão conectou. Causa:");
    for (const line of causes(error)) console.error(`  - ${line}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
