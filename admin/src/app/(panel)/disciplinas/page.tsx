import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { prisma } from "@portfolio/database";
import { reorderCourses } from "@/actions/catalog";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";
import { CourseIcon } from "@/lib/course-icons";
import { COURSE_STATUSES } from "@/lib/labels";

export const metadata: Metadata = { title: "Disciplinas" };

const STATUS_TONE = { draft: "neutral", published: "success", archived: "warning" } as const;

/** Disciplinas agrupadas por seção, com arrastar para ordenar (RF25). */
export default async function CoursesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      courses: {
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { modules: true } },
          modules: { select: { topics: { select: { _count: { select: { lessons: true } } } } } },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Disciplinas"
        description="Árvore: disciplina → módulos → temas → aulas. Clique numa disciplina para montar a estrutura."
        actions={
          <ButtonLink href="/disciplinas/nova">
            <Plus className="size-4" aria-hidden /> Nova disciplina
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-6">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardTitle
              actions={
                <ButtonLink
                  href={`/disciplinas/nova?categoria=${category.id}`}
                  variant="ghost"
                  size="sm"
                >
                  <Plus className="size-4" aria-hidden /> Adicionar aqui
                </ButtonLink>
              }
            >
              {category.name}
            </CardTitle>
            <SortableList
              onReorder={reorderCourses.bind(null, category.id)}
              empty={<EmptyState>Nenhuma disciplina nesta seção.</EmptyState>}
              items={category.courses.map((course) => {
                const lessons = course.modules
                  .flatMap((m) => m.topics)
                  .reduce((sum, t) => sum + t._count.lessons, 0);
                return {
                  id: course.id,
                  content: (
                    <Link
                      href={`/disciplinas/${course.id}`}
                      className="group flex items-center gap-3"
                    >
                      <span className="rounded-btn border-border bg-surface flex size-9 shrink-0 items-center justify-center border">
                        <CourseIcon name={course.icon} color={course.color} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="group-hover:text-accent flex flex-wrap items-center gap-2 text-sm font-medium">
                          {course.title}
                          <Badge tone={STATUS_TONE[course.status]}>
                            {COURSE_STATUSES[course.status]}
                          </Badge>
                        </span>
                        <span className="text-muted block text-xs">
                          /disciplina/{course.slug} · {course._count.modules} módulo(s) · {lessons}{" "}
                          aula(s)
                        </span>
                      </span>
                      <ChevronRight className="text-muted size-4" aria-hidden />
                    </Link>
                  ),
                };
              })}
            />
          </Card>
        ))}
        {categories.length === 0 ? <EmptyState>Crie primeiro as categorias.</EmptyState> : null}
      </div>
    </>
  );
}
