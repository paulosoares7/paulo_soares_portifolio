import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/catalog/CategoryNav";
import { CourseCard } from "@/components/catalog/CourseCard";
import { Container, PageTitle } from "@/components/ui/Container";
import { getCatalog } from "@/lib/catalog";

export const revalidate = 300;

type Params = Promise<{ categorySlug: string }>;

/** Título e descrição da seção para buscadores. */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = (await getCatalog()).find((c) => c.slug === categorySlug);
  return category
    ? {
        title: `Aulas · ${category.name}`,
        description: category.description ?? `Disciplinas de Física: ${category.name}.`,
      }
    : {};
}

/** Seção do catálogo: disciplinas publicadas de uma categoria. */
export default async function CategoryPage({ params }: { params: Params }) {
  const { categorySlug } = await params;
  const categories = await getCatalog();
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) notFound();

  return (
    <Container>
      <PageTitle
        title={category.name}
        description={category.description ?? "Disciplinas desta seção."}
      />
      <CategoryNav
        categories={categories.map((c) => ({
          slug: c.slug,
          name: c.name,
          count: c.courses.length,
        }))}
        active={category.slug}
      />
      {category.courses.length === 0 ? (
        <p className="rounded-card border-border text-muted border border-dashed px-4 py-12 text-center">
          Ainda não há disciplinas publicadas nesta seção.
        </p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {category.courses.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
