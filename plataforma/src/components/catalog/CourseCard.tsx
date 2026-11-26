import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import { CourseIcon } from "@/lib/course-icons";
import { plural } from "@/lib/format";
import type { CourseCardData } from "@/lib/catalog";

/**
 * Cartão de disciplina (inspiração 07, no tema escuro): ícone colorido,
 * título, descrição e o selo de itens grátis.
 */
export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/disciplina/${course.slug}`}
      className="group rounded-card border-border bg-surface hover:border-accent/70 flex h-full flex-col gap-4 border p-6 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <CourseIcon name={course.icon} color={course.color} />
        {course.freeItems ? (
          <Badge tone="success">
            <Gift className="size-3" aria-hidden />{" "}
            {plural(course.freeItems, "aula grátis", "aulas grátis")}
          </Badge>
        ) : null}
      </div>
      <div>
        <h3 className="group-hover:text-accent text-lg font-semibold">{course.title}</h3>
        <p className="text-muted mt-1 text-sm leading-relaxed">{course.shortDescription}</p>
      </div>
      <div className="border-border mt-auto flex items-center justify-between border-t pt-4 text-sm">
        <span className="text-muted">{plural(course.lessons, "aula", "aulas")}</span>
        <span className="text-accent inline-flex items-center gap-1 font-medium">
          Ver aulas{" "}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
