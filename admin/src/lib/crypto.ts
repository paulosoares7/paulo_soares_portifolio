import { createHash, randomBytes } from "node:crypto";

/**
 * SHA-256 em hexadecimal (64 caracteres), igual ao SHA2(x, 256) do MySQL.
 * @param value Texto de entrada.
 * @returns Hash hexadecimal.
 */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Token aleatório para cookies de sessão.
 * @param bytes Quantidade de bytes aleatórios (padrão 32 = 256 bits).
 * @returns Token em base64url.
 */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
