// Prepara os testes: abre uma sessão do painel direto no banco (o mesmo que o
// login faz: token no cookie, só o SHA-256 em admin_sessions) e guarda o
// cookie em e2e/.auth/admin.json. Assim nenhuma senha fica no repositório.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Roda o script do banco que cria a sessão e devolve o token e a validade. */
function createAdminSession(): { token: string; expiresAt: string } {
  const databaseDir = path.resolve(__dirname, "../database");
  const output = execFileSync("npx", ["tsx", "../e2e/support/admin-session.ts"], {
    cwd: databaseDir,
    encoding: "utf8",
    // No Windows o npx é um .cmd: precisa do shell.
    shell: process.platform === "win32",
  });
  const line = output.trim().split(/\r?\n/).pop() ?? "";
  return JSON.parse(line) as { token: string; expiresAt: string };
}

/** Executado uma vez antes de todos os testes. */
export default function globalSetup(): void {
  const { token, expiresAt } = createAdminSession();
  const authDir = path.resolve(__dirname, ".auth");
  mkdirSync(authDir, { recursive: true });
  writeFileSync(
    path.join(authDir, "admin.json"),
    JSON.stringify({
      cookies: [
        {
          name: "admin_session",
          value: token,
          domain: "localhost",
          path: "/",
          expires: Math.floor(new Date(expiresAt).getTime() / 1000),
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }),
  );
}
