// Destino depois do login (?next=). Só caminhos deste site, para ninguém usar
// o link de login para mandar o aluno a outro endereço.

/**
 * Valida o destino depois do login.
 * @param next Valor de ?next= (pode vir de qualquer lugar).
 * @param fallback Destino padrão.
 * @returns Caminho interno seguro.
 */
export function safeNext(next: string | null | undefined, fallback = "/minha-area"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\"))
    return fallback;
  return next;
}

/**
 * Monta o link de login que volta para a página atual.
 * @param path Caminho para voltar depois do login.
 * @returns /entrar?next=...
 */
export function loginUrl(path: string): string {
  return `/entrar?next=${encodeURIComponent(safeNext(path, "/"))}`;
}
