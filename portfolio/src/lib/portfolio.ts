// Consultas das páginas do portfólio (Home, Sobre, Publicações).
import { cache } from "react";
import { prisma, type Prisma } from "@portfolio/database";
import { PUBLICATION_TYPES } from "@/lib/labels";

/** Tipo de publicação aceito no filtro. */
export type PublicationType = keyof typeof PUBLICATION_TYPES;

/**
 * Dados da home: perfil, números, publicações em destaque e resumo das aulas
 * (os 4 grupos do catálogo com a quantidade de disciplinas publicadas).
 * @returns Tudo que a home exibe.
 */
export const getHomeData = cache(async () => {
  const [profile, highlights, featured, courses, freeLessons, categories] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: 1 },
      include: {
        photoFile: { select: { publicUrl: true } },
        cvFile: { select: { publicUrl: true } },
      },
    }),
    prisma.profileHighlight.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.publication.findMany({
      where: { isFeatured: true, isVisible: true },
      orderBy: [{ year: "desc" }, { title: "asc" }],
      take: 3,
    }),
    prisma.course.count({ where: { status: "published" } }),
    prisma.lesson.count({
      where: {
        isPreview: true,
        status: "published",
        topic: { module: { status: "published", course: { status: "published" } } },
      },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        // Disciplinas publicadas ficam nos grupos da categoria.
        groups: { select: { _count: { select: { courses: { where: { status: "published" } } } } } },
      },
    }),
  ]);
  return {
    profile,
    highlights,
    featured,
    courses,
    freeLessons,
    categories: categories.map(({ groups, ...category }) => ({
      ...category,
      courses: groups.reduce((sum, g) => sum + g._count.courses, 0),
    })),
  };
});

/**
 * Lista de ferramentas da página Sobre, guardada em site_settings (chave "tools").
 * Formato aceito: ["GeoGebra", "PhET", ...]. Sem a chave, a seção não aparece.
 * @returns Nomes das ferramentas.
 */
async function getTools(): Promise<string[]> {
  const setting = await prisma.siteSetting.findUnique({ where: { settingKey: "tools" } });
  const value: unknown = setting?.value;
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim() !== "")
    .slice(0, 24);
}

/**
 * Dados da página Sobre: bio longa, formação, atuação, áreas e ferramentas.
 * @returns Conteúdo da página.
 */
export const getAboutData = cache(async () => {
  const [profile, degrees, experiences, areas, tools] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: 1 },
      include: { cvFile: { select: { publicUrl: true } } },
    }),
    prisma.academicDegree.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.experience.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.researchArea.findMany({ orderBy: { sortOrder: "asc" } }),
    getTools(),
  ]);
  return { profile, degrees, experiences, areas, tools };
});

/** Filtros da página Publicações (vindos da URL). */
export type PublicationFilters = { q?: string; type?: string; year?: string };

/**
 * Publicações visíveis com busca por título e filtros por tipo e ano (RF03).
 * @param filters Busca e filtros.
 * @returns Publicações filtradas, anos e tipos existentes.
 */
export async function getPublications(filters: PublicationFilters) {
  const where: Prisma.PublicationWhereInput = { isVisible: true };
  const q = filters.q?.trim().slice(0, 100);
  if (q) where.title = { contains: q };
  if (filters.type && filters.type in PUBLICATION_TYPES)
    where.type = filters.type as PublicationType;
  if (filters.year && /^\d{4}$/.test(filters.year)) where.year = Number(filters.year);

  const [publications, years, types] = await Promise.all([
    prisma.publication.findMany({ where, orderBy: [{ year: "desc" }, { title: "asc" }] }),
    prisma.publication.findMany({
      where: { isVisible: true },
      distinct: ["year"],
      select: { year: true },
      orderBy: { year: "desc" },
    }),
    prisma.publication.findMany({
      where: { isVisible: true },
      distinct: ["type"],
      select: { type: true },
    }),
  ]);
  return { publications, years: years.map((y) => y.year), types: types.map((t) => t.type) };
}

/**
 * Link do DOI no formato canônico.
 * @param doi DOI salvo (sem prefixo).
 * @returns https://doi.org/...
 */
export function doiUrl(doi: string): string {
  return `https://doi.org/${doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}`;
}
