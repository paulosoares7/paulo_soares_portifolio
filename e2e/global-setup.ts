// Prepara os testes: abre uma sessão do painel direto no banco (o mesmo que o
// login faz: token no cookie, só o SHA-256 em admin_sessions) e guarda o
// cookie em e2e/.auth/admin.json. Também recria o aluno de teste da
// plataforma com uma senha aleatória (e2e/.auth/student.json, fora do git).
// Assim nenhuma senha fica no repositório.
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

/**
 * Roda um script de e2e/support com database/ como pasta atual (lê o
 * DATABASE_URL de database/.env) e devolve o JSON da última linha.
 * @param script Nome do arquivo em e2e/support.
 * @returns Objeto impresso pelo script.
 */
function runSupportScript<T>(script: string): T {
  const databaseDir = path.resolve(__dirname, "../database");
  const output = execFileSync("npx", ["tsx", `../e2e/support/${script}`], {
    cwd: databaseDir,
    encoding: "utf8",
    // No Windows o npx é um .cmd: precisa do shell.
    shell: process.platform === "win32",
  });
  const line = output.trim().split(/\r?\n/).pop() ?? "";
  return JSON.parse(line) as T;
}

/** Executado uma vez antes de todos os testes. */
export default function globalSetup(): void {
  const { token, expiresAt } = runSupportScript<{ token: string; expiresAt: string }>(
    "admin-session.ts",
  );
  const student = runSupportScript<{ email: string; password: string }>("student-account.ts");
  const authDir = path.resolve(__dirname, ".auth");
  mkdirSync(authDir, { recursive: true });
  writeFileSync(path.join(authDir, "student.json"), JSON.stringify(student));
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
