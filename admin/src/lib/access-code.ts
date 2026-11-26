// Código de acesso do aluno (docs/05-fluxos.md, seção 1).
import { randomInt } from "node:crypto";
import { sha256 } from "@/lib/crypto";

// Sem caracteres ambíguos: sem 0/O e sem 1/I/L.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Sorteia um código de 16 caracteres (crypto, sem viés) e calcula o que vai
 * para o banco. O texto do código só existe aqui e na tela/e-mail.
 * @returns code (XXXX-XXXX-XXXX-XXXX), hash SHA-256 e dica (4 últimos).
 */
export function generateAccessCode(): { code: string; hash: string; hint: string } {
  let raw = "";
  for (let i = 0; i < 16; i += 1) raw += ALPHABET[randomInt(ALPHABET.length)];
  return {
    code: raw.match(/.{4}/g)?.join("-") ?? raw,
    hash: hashAccessCode(raw),
    hint: raw.slice(-4),
  };
}

/**
 * Normaliza (sem hífens, maiúsculo) e calcula o SHA-256, como o site faz no login.
 * @param code Código digitado.
 * @returns Hash hexadecimal.
 */
export function hashAccessCode(code: string): string {
  return sha256(code.replace(/[^0-9a-z]/gi, "").toUpperCase());
}
