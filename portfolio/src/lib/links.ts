// Links para a plataforma de aulas. Sem banco: pode ser usado no navegador.

/** Endereço da plataforma de aulas (outro projeto; links do menu e da home). */
export const PLATAFORMA_URL = (
  process.env.NEXT_PUBLIC_PLATAFORMA_URL || "http://localhost:3002"
).replace(/\/+$/, "");

/**
 * Monta um link para uma página da plataforma de aulas.
 * @param path Caminho na plataforma (ex.: "/aulas/vestibulares").
 * @returns URL completa.
 */
export function plataformaUrl(path = "/"): string {
  return `${PLATAFORMA_URL}${path === "/" ? "" : path}`;
}
