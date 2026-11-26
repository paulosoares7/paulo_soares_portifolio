// E-mail transacional pelo Resend (preparado: sem RESEND_API_KEY, nada é enviado).

/**
 * Diz se o envio de e-mail está configurado.
 * @returns true quando RESEND_API_KEY e MAIL_FROM existem.
 */
export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

/**
 * Escapa texto para entrar no HTML do e-mail.
 * @param value Texto livre.
 * @returns Texto seguro para HTML.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * Envia um e-mail pelo Resend.
 * @param message Destinatário, assunto e corpo em texto e HTML.
 */
export async function sendMail(message: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  if (!isMailConfigured()) throw new Error("E-mail não configurado (RESEND_API_KEY e MAIL_FROM).");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.MAIL_FROM, ...message }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`O Resend respondeu ${response.status}.`);
}
