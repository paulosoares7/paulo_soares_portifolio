// Links para o portfólio (outro projeto). Sem banco: pode ser usado no navegador.

/** Endereço do portfólio do professor. */
export const PORTFOLIO_URL = (
  process.env.NEXT_PUBLIC_PORTFOLIO_URL || "http://localhost:3000"
).replace(/\/+$/, "");

/**
 * Monta um link para uma página do portfólio.
 * @param path Caminho no portfólio (ex.: "/contato").
 * @returns URL completa.
 */
export function portfolioUrl(path = "/"): string {
  return `${PORTFOLIO_URL}${path === "/" ? "" : path}`;
}
