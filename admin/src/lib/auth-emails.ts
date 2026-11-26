// Textos dos e-mails de redefinição de senha (admin e aluno). O modelo é o
// mesmo da plataforma (plataforma/src/lib/auth-emails.ts).
import { escapeHtml } from "@/lib/mail";

/**
 * Monta um e-mail simples com um botão.
 * @param name Nome de quem recebe.
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
 * E-mail de redefinição da senha do painel.
 * @param name Nome do administrador.
 * @param url Link para criar a nova senha (1 hora, uso único).
 * @returns Assunto e corpo.
 */
export function adminResetEmail(name: string, url: string) {
  return {
    subject: "Redefinir a senha do painel",
    ...layout(
      name,
      ["Recebemos um pedido para criar uma nova senha de acesso ao painel."],
      { label: "Criar nova senha", url },
      "O link vale por 1 hora e só pode ser usado uma vez. Ao trocar a senha, todas as sessões do painel são encerradas. Se não foi você, ignore este e-mail.",
    ),
  };
}

/**
 * E-mail de redefinição de senha do aluno, pedido pelo painel.
 * @param name Nome do aluno.
 * @param url Link da plataforma para criar a nova senha (1 hora, uso único).
 * @returns Assunto e corpo.
 */
export function studentResetEmail(name: string, url: string) {
  return {
    subject: "Criar ou redefinir a sua senha",
    ...layout(
      name,
      [
        "O professor enviou este link para você criar (ou trocar) a senha da plataforma de aulas.",
        "Você também pode entrar com o Google usando este e-mail.",
      ],
      { label: "Criar senha", url },
      "O link vale por 1 hora e só pode ser usado uma vez. Ao salvar a senha, você sai de todos os aparelhos.",
    ),
  };
}

/**
 * Convite do aluno cadastrado pelo painel: criar a senha ou entrar com o Google.
 * @param name Nome do aluno.
 * @param url Link da plataforma para criar a senha (7 dias, uso único).
 * @returns Assunto e corpo.
 */
export function studentInviteEmail(name: string, url: string) {
  return {
    subject: "Seu acesso à plataforma de aulas",
    ...layout(
      name,
      [
        "O professor cadastrou você na plataforma de aulas de Física.",
        "Crie a sua senha pelo botão abaixo ou, se preferir, entre com o Google usando este mesmo e-mail.",
      ],
      { label: "Criar minha senha", url },
      'O link vale por 7 dias e só pode ser usado uma vez. Depois disso, use "Esqueci a senha" na tela de entrada.',
    ),
  };
}
