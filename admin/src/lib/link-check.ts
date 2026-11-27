// "Testar link": confere se um endereço externo responde. Roda no servidor do
// painel, então recusa endereços internos (localhost, rede local) para o
// botão não virar uma forma de sondar a rede do servidor.
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isHttpsUrl, linkSource } from "@portfolio/database/external-link";

const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 5;

/** Resultado do teste para mostrar no formulário. */
export type LinkCheck = { ok: boolean; message: string };

/**
 * Diz se o IP é da rede interna/local (não pode ser testado).
 * @param ip IPv4 ou IPv6.
 * @returns true para loopback, privado, link-local etc.
 */
function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v6 = ip.toLowerCase();
    if (v6.startsWith("::ffff:")) return isPrivateIp(v6.slice(7));
    return v6 === "::1" || v6 === "::" || /^(fc|fd|fe8|fe9|fea|feb)/.test(v6);
  }
  const [a = 0, b = 0] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

/** Confere se o host aponta só para endereços públicos. */
async function isPublicHost(hostname: string): Promise<boolean> {
  if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal"))
    return false;
  try {
    const addresses = await lookup(hostname, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

/**
 * Testa o link seguindo os redirecionamentos (cada um conferido de novo).
 * @param value URL digitada.
 * @returns ok e a mensagem para o admin.
 */
export async function checkExternalLink(value: string): Promise<LinkCheck> {
  if (!isHttpsUrl(value)) return { ok: false, message: "Use um endereço que comece com https://." };
  let current = new URL(value.trim());
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    if (current.protocol !== "https:" || !(await isPublicHost(current.hostname))) {
      return { ok: false, message: "Endereço não permitido (só sites públicos com https)." };
    }
    let response: Response;
    try {
      response = await fetch(current, {
        // GET em vez de HEAD: Drive, OneDrive e Dropbox respondem errado ao HEAD.
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { "User-Agent": "Mozilla/5.0 (verificador de links do painel)" },
      });
      // Só o status interessa: não baixa o arquivo inteiro.
      await response.body?.cancel();
    } catch {
      return { ok: false, message: "O endereço não respondeu (fora do ar ou demorou demais)." };
    }
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, current);
      // Drive/Docs privados mandam para a tela de login do Google.
      if (current.hostname === "accounts.google.com") {
        return {
          ok: false,
          message:
            'O arquivo do Google não está público. No Drive: Compartilhar → "Qualquer pessoa com o link" → Leitor.',
        };
      }
      continue;
    }
    if (response.ok) {
      const source = linkSource(value);
      return {
        ok: true,
        message:
          source === "discord"
            ? "Respondeu agora, mas links do Discord expiram."
            : `O endereço respondeu (${response.status}).`,
      };
    }
    if (response.status === 401 || response.status === 403)
      return { ok: false, message: `Acesso negado (${response.status}): o link não está público.` };
    if (response.status === 404) return { ok: false, message: "Página não encontrada (404)." };
    return { ok: false, message: `O endereço respondeu com erro (${response.status}).` };
  }
  return { ok: false, message: "Redirecionamentos demais." };
}
