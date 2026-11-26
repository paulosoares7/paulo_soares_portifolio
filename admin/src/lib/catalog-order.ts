import type { Prisma } from "@portfolio/database";

/**
 * Ordem das disciplinas igual à do catálogo: categoria, depois grupo, depois
 * a própria disciplina. Usada nos seletores e listas do painel.
 */
export const courseCatalogOrder: Prisma.CourseOrderByWithRelationInput[] = [
  { group: { category: { sortOrder: "asc" } } },
  { group: { sortOrder: "asc" } },
  { sortOrder: "asc" },
];
