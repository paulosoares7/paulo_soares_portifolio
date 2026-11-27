"use server";

import { requireAdmin } from "@/lib/auth";
import { checkExternalLink, type LinkCheck } from "@/lib/link-check";

/**
 * Botão "Testar link" dos formulários: confere se o endereço responde.
 * @param url Endereço digitado.
 * @returns ok e a mensagem para mostrar.
 */
export async function testExternalLink(url: unknown): Promise<LinkCheck> {
  await requireAdmin();
  if (typeof url !== "string" || url.length > 500) return { ok: false, message: "Link inválido." };
  return checkExternalLink(url);
}
