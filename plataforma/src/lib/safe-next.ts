// Destino depois do login (?next=). Só caminhos deste site, para ninguém usar
// o link de login para mandar o aluno a outro endereço.

/**
 * Valida o destino depois do login.
 * @param next Valor de ?next= (pode vir de qualquer lugar).
 * @param fallback Destino padrão.
 * @returns Caminho interno seguro.
 */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\"))
    return fallback;
  return next;
}

/**
 * Página para onde o aluno volta depois de entrar pelo botão "Entrar" do topo.
 * Só aula, disciplina e atividade pedem a volta; de qualquer outra página o
 * aluno vai para o Início, que para quem está logado é o painel dele.
 * @param pathname Página atual.
 * @returns Caminho para o ?next= ou null (vai para o painel).
 */
export function loginReturnPath(pathname: string | null): string | null {
  if (!pathname || !/^\/(disciplina|atividades)\//.test(pathname)) return null;
  return safeNext(pathname);
}

/**
 * Monta o link de login que volta para a página atual.
 * @param path Caminho para voltar depois do login.
 * @returns /entrar?next=...
 */
export function loginUrl(path: string): string {
  return `/entrar?next=${encodeURIComponent(safeNext(path, "/"))}`;
}
