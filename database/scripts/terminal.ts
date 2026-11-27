// Perguntas no terminal para os scripts do banco (create-admin e
// setup-online-db). Senhas são digitadas sem aparecer na tela.
import { createInterface } from "node:readline/promises";

/**
 * Faz uma pergunta e devolve a resposta (visível na tela).
 * @param prompt Texto da pergunta.
 * @param fallback Resposta usada quando a pessoa só aperta Enter.
 * @returns Resposta sem espaços nas pontas.
 */
export async function askQuestion(prompt: string, fallback = ""): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(prompt)).trim();
  rl.close();
  return answer || fallback;
}

/**
 * Lê uma senha do terminal sem mostrar os caracteres digitados.
 * @param prompt Texto exibido antes da digitação.
 * @returns A senha digitada.
 */
export function readHiddenInput(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Error("Terminal não interativo: passe a senha pela variável de ambiente."));
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
