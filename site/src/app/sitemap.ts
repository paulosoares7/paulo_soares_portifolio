import type { MetadataRoute } from "next";
import { prisma } from "@portfolio/database";
import { SITE_URL } from "@/lib/site";

// Gerado a cada 1 h a partir do conteúdo publicado (RNF06).
export const revalidate = 3600;

/** Sitemap com páginas fixas, seções, disciplinas e aulas publicadas. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, courses, lessons] = await Promise.all([
    prisma.category.findMany({
      where: { courses: { some: { status: "published" } } },
      select: { slug: true },
    }),
    prisma.course.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    }),
    prisma.lesson.findMany({
      where: {
        status: "published",
        topic: { module: { status: "published", course: { status: "published" } } },
      },
      select: {
        slug: true,
        updatedAt: true,
        topic: {
          select: { module: { select: { slug: true, course: { select: { slug: true } } } } },
        },
      },
    }),
  ]);

  const fixed = ["", "/sobre", "/publicacoes", "/contato", "/aulas", "/assinar"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
  return [
    ...fixed,
    ...categories.map((c) => ({ url: `${SITE_URL}/aulas/${c.slug}` })),
    ...courses.map((c) => ({ url: `${SITE_URL}/disciplina/${c.slug}`, lastModified: c.updatedAt })),
    ...lessons.map((l) => ({
      url: `${SITE_URL}/disciplina/${l.topic.module.course.slug}/${l.topic.module.slug}/${l.slug}`,
      lastModified: l.updatedAt,
    })),
  ];
}
