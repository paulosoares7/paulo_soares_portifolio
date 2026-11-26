// Textos dos e-mails do login (confirmação, redefinição e conta existente).

/**
 * Escapa texto para entrar no HTML do e-mail.
 * @param value Texto livre (ex.: nome do aluno).
 * @returns Texto seguro para HTML.
 */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * Monta um e-mail simples com um botão.
 * @param name Nome do aluno.
 * @param lines Parágrafos antes do botão.
 * @param action Texto e link do botão.
 * @param footer Aviso no fim.
 * @returns Corpo em texto e HTML.
 */
function layout(
  name: string,
  lines: string[],
  action: { label: string; url: string },
  footer: string,
): { text: string; html: string } {
  const text = [
    `Olá, ${name}!`,
    "",
    ...lines,
    "",
    `${action.label}: ${action.url}`,
    "",
    footer,
  ].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0b1622">
<p>Olá, ${escapeHtml(name)}!</p>
${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n")}
<p><a href="${escapeHtml(action.url)}" style="display:inline-block;background:#0ea5e9;color:#0b1622;padding:10px 18px;border-radius:8px;font-weight:bold;text-decoration:none">${escapeHtml(action.label)}</a></p>
<p style="font-size:13px;color:#64748b">${escapeHtml(footer)}</p>
</div>`;
  return { text, html };
}

/**
 * E-mail de confirmação do cadastro.
 * @param name Nome do aluno.
 * @param url Link de confirmação (vale 1 hora).
 */
export function verificationEmail(name: string, url: string) {
  return {
    subject: "Confirme o seu e-mail",
    ...layout(
      name,
      ["Falta pouco: confirme o seu e-mail para entrar na plataforma de aulas."],
      { label: "Confirmar e-mail", url },
      "O link vale por 1 hora. Se você não criou esta conta, ignore este e-mail.",
    ),
  };
}

/**
 * E-mail de redefinição de senha.
 * @param name Nome do aluno.
 * @param url Link para criar a nova senha (1 hora, uso único).
 */
export function resetPasswordEmail(name: string, url: string) {
  return {
    subject: "Redefinir a sua senha",
    ...layout(
      name,
      ["Recebemos um pedido para criar uma nova senha para a sua conta."],
      { label: "Criar nova senha", url },
      "O link vale por 1 hora e só pode ser usado uma vez. Ao trocar a senha, você sai de todos os aparelhos. Se não foi você, ignore este e-mail.",
    ),
  };
}

/**
 * Aviso para quem tentou se cadastrar com um e-mail que já tem conta. A tela
 * de cadastro não revela isso; só o dono do e-mail fica sabendo.
 * @param name Nome da conta existente.
 * @param url Link para a página "Esqueci a senha".
 */
export function existingAccountEmail(name: string, url: string) {
  return {
    subject: "Você já tem uma conta",
    ...layout(
      name,
      [
        "Alguém (provavelmente você) tentou criar uma conta com este e-mail, mas ela já existe.",
        "Entre com o Google usando este e-mail ou crie uma senha pelo link abaixo.",
      ],
      { label: "Criar ou trocar a senha", url },
      "Se não foi você, ignore este e-mail: nada mudou na sua conta.",
    ),
  };
}
