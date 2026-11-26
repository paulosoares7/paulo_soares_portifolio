import { prisma } from "@portfolio/database";
import type { CourseTree } from "@/types/catalog";

/**
 * Carrega disciplinas com módulos e aulas (na ordem do catálogo).
 * @returns Árvore para seletores em cascata.
 */
export async function loadCourseTree(): Promise<CourseTree[]> {
  const courses = await prisma.course.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: {
      id: true,
      title: true,
      modules: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          topics: {
            orderBy: { sortOrder: "asc" },
            select: {
              lessons: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true } },
            },
          },
        },
      },
    },
  });
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    modules: c.modules.map((m) => ({
      id: m.id,
      title: m.title,
      lessons: m.topics.flatMap((t) => t.lessons),
    })),
  }));
}
