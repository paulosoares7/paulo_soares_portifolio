// E-mail transacional pelo Resend. Sem RESEND_API_KEY em desenvolvimento, o
// e-mail (com o link) aparece no terminal, para dar para testar o login.

/**
 * Diz se o envio de e-mail está configurado.
 * @returns true quando RESEND_API_KEY e MAIL_FROM existem.
 */
export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

/** Mensagem pronta para enviar. */
export type MailMessage = { to: string; subject: string; text: string; html: string };

/**
 * Envia um e-mail. Sem Resend: em desenvolvimento mostra no terminal; em
 * produção registra o erro (o fluxo do usuário segue, sem expor detalhes).
 * @param message Destinatário, assunto e corpo em texto e HTML.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  if (!isMailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `\n[e-mail não enviado: Resend não configurado]\nPara: ${message.to}\nAssunto: ${message.subject}\n${message.text}\n`,
      );
      return;
    }
    console.error(`E-mail "${message.subject}" não enviado: configure RESEND_API_KEY e MAIL_FROM.`);
    return;
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.MAIL_FROM, ...message }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    console.error(`O Resend respondeu ${response.status} ao enviar "${message.subject}".`);
}
