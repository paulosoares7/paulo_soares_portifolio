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

// Custo 12: mesmo prefixo ($2b$12$) usado no placeholder do seed.
const BCRYPT_COST = 12;

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("E-mail inválido.")).pipe(z.string().max(190)),
  name: z.string().trim().min(1, "Informe o nome.").max(120),
  password: z
    .string()
    .min(12, "A senha precisa ter pelo menos 12 caracteres.")
    .max(72, "O bcrypt só usa os primeiros 72 bytes; use no máximo 72 caracteres."),
});

/**
 * Lê uma senha do terminal sem mostrar os caracteres digitados.
 * @param prompt Texto exibido antes da digitação.
 * @returns A senha digitada.
 */
function readHiddenInput(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Error("Terminal não interativo: defina ADMIN_PASSWORD."));
      return;
    }
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const onData = (chunk: string): void => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (char === "\u0003") {
          // Ctrl+C
          stdin.setRawMode(false);
          stdout.write("\n");
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };
    stdin.on("data", onData);
  });
}

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
