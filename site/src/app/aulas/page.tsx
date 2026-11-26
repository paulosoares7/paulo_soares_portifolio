import type { Metadata } from "next";
import { CategoryNav } from "@/components/catalog/CategoryNav";
import { CourseCard } from "@/components/catalog/CourseCard";
import { Container, PageTitle, SectionTitle } from "@/components/ui/Container";
import { getCatalog } from "@/lib/catalog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Aulas",
  description:
    "Aulas de Física para Vestibulares, Ensino Médio, Ensino Superior e Concursos, com aulas grátis.",
};

/** Catálogo (RF05): disciplinas publicadas em seções. */
export default async function CatalogPage() {
  const categories = await getCatalog();
  const withCourses = categories.filter((c) => c.courses.length > 0);

  return (
    <Container>
      <PageTitle
        title="Aulas de"
        accent="Física"
        description="Escolha a disciplina. As aulas grátis abrem sem cadastro; as demais fazem parte da assinatura."
      />
      <CategoryNav
        categories={categories.map((c) => ({
          slug: c.slug,
          name: c.name,
          count: c.courses.length,
        }))}
      />
      {withCourses.length === 0 ? (
        <p className="rounded-card border-border text-muted border border-dashed px-4 py-12 text-center">
          Nenhuma disciplina publicada ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-14">
          {withCourses.map((category) => (
            <section key={category.id} aria-labelledby={`secao-${category.slug}`}>
              <SectionTitle>
                <span id={`secao-${category.slug}`}>{category.name}</span>
              </SectionTitle>
              {category.description ? (
                <p className="text-muted -mt-3 mb-5 text-sm">{category.description}</p>
              ) : null}
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {category.courses.map((course) => (
                  <li key={course.id}>
                    <CourseCard course={course} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
