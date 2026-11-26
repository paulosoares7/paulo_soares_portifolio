import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CourseCard } from "@/components/catalog/CourseCard";
import type { CatalogCategory } from "@/lib/catalog";

type Group = CatalogCategory["groups"][number];

/**
 * Bloco de um grupo no catálogo: nome (link para a página do grupo) e os
 * cartões das disciplinas publicadas.
 * @param categorySlug Categoria do grupo, para montar o endereço.
 * @param group Grupo com as disciplinas.
 */
export function GroupSection({ categorySlug, group }: { categorySlug: string; group: Group }) {
  const href = `/aulas/${categorySlug}/${group.slug}`;
  const headingId = `grupo-${categorySlug}-${group.slug}`;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 id={headingId} className="text-lg font-semibold">
          <Link href={href} className="hover:text-accent">
            {group.name}
          </Link>
        </h3>
        <Link
          href={href}
          className="text-accent inline-flex shrink-0 items-center gap-1 text-sm hover:underline"
        >
          Ver grupo <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      {group.description ? (
        <p className="text-muted -mt-2 mb-4 text-sm">{group.description}</p>
      ) : null}
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {group.courses.map((course) => (
          <li key={course.id}>
            <CourseCard course={course} />
          </li>
        ))}
      </ul>
    </section>
  );
}
