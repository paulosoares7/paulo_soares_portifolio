// Ponto de entrada do pacote @portfolio/database.
// admin e site importam daqui: `import { prisma } from "@portfolio/database"`.
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "./generated/prisma/client";

// Reexporta tipos, enums e o namespace Prisma gerados.
export * from "./generated/prisma/client";

/**
 * Cria o adaptador do driver a partir da DATABASE_URL.
 * O Prisma 7 conversa com o MySQL pelo driver `mariadb` (compatível com MySQL).
 * @param databaseUrl URL no formato mysql://usuario:senha@host:porta/banco
 * @returns Adaptador pronto para o PrismaClient.
 */
function createAdapter(databaseUrl: string): PrismaMariaDb {
  const url = new URL(databaseUrl);
  // Banco na nuvem (TiDB Cloud e outros) exige conexão criptografada: a URL
  // termina com ?sslaccept=strict, o mesmo parâmetro que o Prisma CLI usa nas
  // migrações. Assim uma única DATABASE_URL serve para os dois. O certificado
  // do servidor é conferido (rejectUnauthorized).
  const tls = url.searchParams.get("sslaccept") === "strict";
  return new PrismaMariaDb({
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ...(tls ? { ssl: { rejectUnauthorized: true, minVersion: "TLSv1.2" } } : {}),
    // O MySQL 8 usa caching_sha2_password; sem TLS (Docker local) o driver
    // precisa buscar a chave pública do servidor para autenticar.
    allowPublicKeyRetrieval: true,
    connectionLimit: 5,
  });
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
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
