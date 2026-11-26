import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { CourseCard } from "@/components/catalog/CourseCard";
import { Container, PageTitle } from "@portfolio/ui/Container";
import { getCatalog } from "@/lib/catalog";

export const revalidate = 300;

type Params = Promise<{ categorySlug: string; groupSlug: string }>;

/**
 * Acha a categoria e o grupo do endereço.
 * @param params Slugs da categoria e do grupo.
 * @returns Os dois, ou null se algum não existir.
 */
async function findGroup(params: Params) {
  const { categorySlug, groupSlug } = await params;
  const category = (await getCatalog()).find((c) => c.slug === categorySlug);
  const group = category?.groups.find((g) => g.slug === groupSlug);
  return category && group ? { category, group } : null;
}

/** Título e descrição do grupo para buscadores. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const found = await findGroup(params);
  if (!found) return {};
  const { category, group } = found;
  return {
    title: `Aulas · ${group.name}`,
    description: group.description ?? `Disciplinas de Física: ${category.name} › ${group.name}.`,
  };
}

/** Página do grupo (ex.: Vestibulares › PSC (UFAM)): as disciplinas publicadas dele. */
export default async function GroupPage({ params }: { params: Params }) {
  const found = await findGroup(params);
  if (!found) notFound();
  const { category, group } = found;

  return (
    <Container>
      <Breadcrumb
        className="pt-8"
        items={[
          { label: "Aulas", href: "/aulas" },
          { label: category.name, href: `/aulas/${category.slug}` },
          { label: group.name },
        ]}
      />
      <PageTitle title={group.name} description={group.description ?? category.name} />
      {group.courses.length === 0 ? (
        <p className="rounded-card border-border text-muted border border-dashed px-4 py-12 text-center">
          Ainda não há disciplinas publicadas neste grupo.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {group.courses.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
