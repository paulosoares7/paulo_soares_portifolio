import { prisma } from "@portfolio/database";
import { courseCatalogOrder } from "@/lib/catalog-order";

/**
 * Disciplinas que podem ocupar vagas (não arquivadas), na ordem do catálogo,
 * com o caminho Categoria › Grupo para diferenciar nomes iguais
 * ("Física" da ESA e "Física" do ENEM).
 * @returns Opções para os seletores de vagas.
 */
export async function loadCourseOptions(): Promise<{ id: number; title: string; path: string }[]> {
  const courses = await prisma.course.findMany({
    where: { status: { not: "archived" } },
    orderBy: courseCatalogOrder,
    select: {
      id: true,
      title: true,
      group: { select: { name: true, category: { select: { name: true } } } },
    },
  });
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    path: `${c.group.category.name} › ${c.group.name}`,
  }));
}
