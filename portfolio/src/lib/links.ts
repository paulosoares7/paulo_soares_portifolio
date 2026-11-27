// Links para a plataforma de aulas. Sem banco: pode ser usado no navegador.
//
// Interruptor único: NEXT_PUBLIC_PLATAFORMA_URL.
// - Vazia: a plataforma ainda não está no ar. Todos os links "Aulas" (menu,
//   ícone, rodapé e seção da home) levam à página /aulas deste portfólio, com
//   o aviso "Aulas em desenvolvimento".
// - Preenchida (ex.: https://aulas.seu-dominio.com): os mesmos links passam a
//   abrir a plataforma, e /aulas redireciona para ela. Basta pôr o endereço
//   (na Vercel: Environment Variables) e publicar de novo; nada no código muda.

/** Endereço da plataforma de aulas, sem a barra no fim ("" = ainda não está no ar). */
export const PLATAFORMA_URL = (process.env.NEXT_PUBLIC_PLATAFORMA_URL ?? "")
  .trim()
  .replace(/\/+$/, "");

/** A plataforma está no ar (endereço preenchido)? */
export const PLATAFORMA_ONLINE = PLATAFORMA_URL !== "";

/** Página do portfólio com o aviso "Aulas em desenvolvimento". */
export const LESSONS_SOON_PATH = "/aulas";

/**
 * Monta um link para uma página da plataforma de aulas. Com a plataforma fora
 * do ar, devolve a página do aviso (/aulas) deste portfólio.
 * @param path Caminho na plataforma (ex.: "/aulas/vestibulares").
 * @returns URL completa da plataforma ou /aulas.
 */
export function plataformaUrl(path = "/"): string {
  if (!PLATAFORMA_ONLINE) return LESSONS_SOON_PATH;
  return `${PLATAFORMA_URL}${path === "/" ? "" : path}`;
}
