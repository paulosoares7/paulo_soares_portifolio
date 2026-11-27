// =====================================================================
// Cria o administrador do painel ou troca a senha dele (bcrypt).
//
// Uso:
//   npm run create-admin -- --email voce@dominio.com --name "Paulo"
//   (a senha é pedida no terminal, sem aparecer na tela)
//
// Em ambientes sem terminal interativo, passe a senha pela variável
// ADMIN_PASSWORD. Nunca passe a senha como argumento: ela ficaria no
// histórico do shell.
// =====================================================================
import "dotenv/config";
import { parseArgs } from "node:util";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../src/index";
import { readHiddenInput } from "./terminal";

// Custo 12: mesmo prefixo ($2b$12$) usado no placeholder do seed.
const BCRYPT_COST = 12;

// E-mail do admin criado pelo seed (prisma/seed.ts e sql/002_seed.sql).
const SEED_PLACEHOLDER_EMAIL = "admin@exemplo.com";

const inputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("E-mail inválido."))
    .pipe(z.string().max(190)),
  name: z.string().trim().min(1, "Informe o nome.").max(120),
  password: z
    .string()
    .min(12, "A senha precisa ter pelo menos 12 caracteres.")
    .max(72, "O bcrypt só usa os primeiros 72 bytes; use no máximo 72 caracteres."),
});

/** Valida a entrada e grava (ou atualiza) o administrador. */
async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
    },
  });

  const password = process.env.ADMIN_PASSWORD ?? (await readHiddenInput("Senha do admin: "));
  if (!process.env.ADMIN_PASSWORD) {
    const confirmation = await readHiddenInput("Repita a senha: ");
    if (confirmation !== password) {
      throw new Error("As senhas não conferem.");
    }
  }

  const parsed = inputSchema.safeParse({
    email: values.email ?? process.env.ADMIN_EMAIL,
    name: values.name ?? process.env.ADMIN_NAME ?? "Administrador",
    password,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join("\n"));
  }
  const input = parsed.data;

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  // Primeiro uso: o seed cria um admin placeholder (admin@exemplo.com) que já é
  // autor de conteúdo de exemplo. Como o sistema tem um único administrador,
  // a conta placeholder é assumida em vez de criar uma segunda.
  const existing = await prisma.adminUser.findUnique({
    where: { email: input.email },
  });
  const placeholder = existing
    ? null
    : await prisma.adminUser.findUnique({
        where: { email: SEED_PLACEHOLDER_EMAIL },
      });
  if (placeholder) {
    const admin = await prisma.adminUser.update({
      where: { id: placeholder.id },
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        isActive: true,
      },
    });
    console.log(`Conta placeholder do seed assumida: ${admin.email} (id ${admin.id}).`);
    return;
  }

  // Upsert pelo e-mail: cria se não existe; se existe, troca a senha e reativa.
  const admin = await prisma.adminUser.upsert({
    where: { email: input.email },
    create: { email: input.email, name: input.name, passwordHash },
    update: { name: input.name, passwordHash, isActive: true },
  });

  console.log(`Administrador pronto: ${admin.email} (id ${admin.id}).`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
