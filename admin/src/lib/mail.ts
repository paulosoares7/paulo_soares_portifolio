// E-mail transacional pelo Resend (preparado: sem RESEND_API_KEY, nada é enviado).

/**
 * Diz se o envio de e-mail está configurado.
 * @returns true quando RESEND_API_KEY e MAIL_FROM existem.
 */
export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * Envia o código de acesso ao aluno (cortesia criada no painel).
 * @param to E-mail do aluno.
 * @param name Nome do aluno.
 * @param code Código no formato XXXX-XXXX-XXXX-XXXX.
 */
export async function sendAccessCodeEmail(to: string, name: string, code: string): Promise<void> {
  if (!isMailConfigured()) throw new Error("E-mail não configurado (RESEND_API_KEY e MAIL_FROM).");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to,
      subject: "Seu código de acesso às aulas",
      text: `Olá, ${name}!\n\nSeu código de acesso é: ${code}\n\nUse-o na página "Entrar" do site. Guarde este e-mail: o código não é mostrado de novo.`,
      html: `<p>Olá, ${escapeHtml(name)}!</p><p>Seu código de acesso é:</p><p style="font-size:22px;font-weight:700;letter-spacing:2px">${escapeHtml(code)}</p><p>Use-o na página <strong>Entrar</strong> do site. Guarde este e-mail: o código não é mostrado de novo.</p>`,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`O Resend respondeu ${response.status}.`);
}
