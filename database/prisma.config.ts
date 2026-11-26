// Configuração do Prisma CLI (Prisma 7: a URL do banco fica aqui, não no schema).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // process.env em vez de env(): assim `prisma generate` (postinstall)
    // funciona mesmo sem DATABASE_URL definida.
    url: process.env.DATABASE_URL ?? "",
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
