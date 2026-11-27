// Ponto de entrada do pacote @portfolio/database.
// admin e site importam daqui: `import { prisma } from "@portfolio/database"`.
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import type { PoolConfig } from "mariadb";
import { PrismaClient } from "./generated/prisma/client";

// Reexporta tipos, enums e o namespace Prisma gerados.
export * from "./generated/prisma/client";

/**
 * Opções de conexão do driver `mariadb` a partir da DATABASE_URL. Usadas pelo
 * adaptador do Prisma e pelo teste de conexão (scripts/check-connection.ts).
 * @param databaseUrl URL no formato mysql://usuario:senha@host:porta/banco
 * @returns Host, porta, usuário, senha, banco, TLS e limite do pool.
 */
export function connectionOptions(databaseUrl: string): PoolConfig {
  const url = new URL(databaseUrl);
  // Banco na nuvem (TiDB Cloud e outros) exige conexão criptografada: a URL
  // termina com ?sslaccept=strict, o mesmo parâmetro que o Prisma CLI usa nas
  // migrações. Assim uma única DATABASE_URL serve para os dois. O certificado
  // do servidor é conferido (rejectUnauthorized).
  const tls = url.searchParams.get("sslaccept") === "strict";
  // servername: o driver abre o TLS sobre o socket já conectado, sem dizer o
  // nome do servidor. Sem ele, o Node confere o certificado contra
  // "localhost" e recusa a conexão (e o TiDB não recebe o SNI). O tipo do
  // driver não lista a opção, mas ele a repassa ao tls.connect do Node.
  const ssl = {
    rejectUnauthorized: true,
    minVersion: "TLSv1.2" as const,
    servername: url.hostname,
  };
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ...(tls ? { ssl } : {}),
    // O MySQL 8 usa caching_sha2_password; sem TLS (Docker local) o driver
    // precisa buscar a chave pública do servidor para autenticar.
    allowPublicKeyRetrieval: true,
    connectionLimit: 5,
  };
}

/**
 * Cria o adaptador do driver a partir da DATABASE_URL.
 * O Prisma 7 conversa com o MySQL pelo driver `mariadb` (compatível com MySQL).
 * @param databaseUrl URL no formato mysql://usuario:senha@host:porta/banco
 * @returns Adaptador pronto para o PrismaClient.
 */
function createAdapter(databaseUrl: string): PrismaMariaDb {
  return new PrismaMariaDb(connectionOptions(databaseUrl));
}

/**
 * Cria um PrismaClient novo ligado ao banco da DATABASE_URL.
 * @returns PrismaClient conectado sob demanda (na primeira consulta).
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não definida. Veja o .env.example.");
  }
  return new PrismaClient({ adapter: createAdapter(databaseUrl) });
}

// Instância única: em desenvolvimento o Next.js recarrega módulos a cada
// alteração, e sem o globalThis cada recarga abriria um pool novo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Instância compartilhada do PrismaClient. */
export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
