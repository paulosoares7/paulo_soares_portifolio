import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/catalog/CategoryNav";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { GroupSection } from "@/components/catalog/GroupSection";
import { Container, PageTitle } from "@portfolio/ui/Container";
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

/** Seção do catálogo: grupos da categoria, cada um com as disciplinas publicadas. */
export default async function CategoryPage({ params }: { params: Params }) {
  const { categorySlug } = await params;
  const categories = await getCatalog();
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) notFound();

  return (
    <Container>
      <Breadcrumb
        className="pt-8"
        items={[{ label: "Aulas", href: "/aulas" }, { label: category.name }]}
      />
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
        <div className="flex flex-col gap-12">
          {category.groups
            .filter((g) => g.courses.length > 0)
            .map((group) => (
              <GroupSection key={group.id} categorySlug={category.slug} group={group} />
            ))}
        </div>
      )}
    </Container>
  );
}
