// Cria uma sessão do painel para os testes (2 h) e imprime o token em JSON.
// Rodado pelo e2e/global-setup.ts com a pasta database/ como diretório atual
// (para ler o DATABASE_URL do database/.env). Só para o banco local.
import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../../database/src/index";

const TWO_HOURS = 2 * 60 * 60 * 1000;

/** Abre a sessão para o primeiro admin ativo. */
async function main(): Promise<void> {
  const admin = await prisma.adminUser.findFirst({
    where: { isActive: true },
    orderBy: { id: "asc" },
  });
  if (!admin) throw new Error("Nenhum admin ativo. Rode o seed ou o create-admin.");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TWO_HOURS);
  await prisma.adminSession.create({
    data: {
      adminUserId: admin.id,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      userAgent: "Playwright (testes)",
      expiresAt,
    },
  });
  console.log(JSON.stringify({ token, expiresAt: expiresAt.toISOString() }));
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
