// Mensagens em português para os erros do Better Auth.

const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha incorretos.",
  EMAIL_NOT_VERIFIED:
    "Confirme o seu e-mail antes de entrar. Enviamos um novo link para a sua caixa de entrada.",
  INVALID_EMAIL: "Digite um e-mail válido.",
  PASSWORD_TOO_SHORT: "A senha precisa ter pelo menos 8 caracteres.",
  PASSWORD_TOO_LONG: "A senha pode ter no máximo 72 caracteres.",
  INVALID_TOKEN: "Este link é inválido, expirou ou já foi usado. Peça um novo.",
  USER_NOT_FOUND: "Este link é inválido, expirou ou já foi usado. Peça um novo.",
  TOKEN_EXPIRED: "Este link expirou. Peça um novo.",
};

/**
 * Traduz o erro devolvido pelo cliente do Better Auth.
 * @param error Erro com code, status e message.
 * @returns Mensagem para mostrar na tela.
 */
export function authErrorMessage(error: {
  code?: string;
  status?: number;
  message?: string;
}): string {
  if (error.status === 429)
    return error.message?.startsWith("Muitas tentativas")
      ? error.message
      : "Muitas tentativas. Espere alguns minutos e tente de novo.";
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  return "Não foi possível concluir agora. Tente de novo em instantes.";
}
