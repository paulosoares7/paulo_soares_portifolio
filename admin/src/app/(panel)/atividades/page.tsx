import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ClipboardCheck, Plus } from "lucide-react";
import { prisma } from "@portfolio/database";
import { courseCatalogOrder } from "@/lib/catalog-order";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { DIFFICULTIES } from "@/lib/labels";

export const metadata: Metadata = { title: "Atividades" };

const DIFFICULTY_TONE = { easy: "success", medium: "warning", hard: "danger" } as const;

/** Atividades por disciplina e módulo (RF28). */
export default async function ActivitiesPage() {
  const [courses, pendingOpen] = await Promise.all([
    prisma.course.findMany({
      orderBy: courseCatalogOrder,
      select: {
        id: true,
        title: true,
        modules: {
          orderBy: { sortOrder: "asc" },
          select: {
            title: true,
            activities: {
              orderBy: { sortOrder: "asc" },
              include: { _count: { select: { questions: true, attempts: true } } },
            },
          },
        },
      },
    }),
    prisma.attemptAnswer.count({
      where: {
        isCorrect: null,
        question: { type: "open" },
        attempt: { submittedAt: { not: null } },
      },
    }),
  ]);
  const withActivities = courses.filter((c) => c.modules.some((m) => m.activities.length));

  return (
    <>
      <PageHeader
        title="Atividades"
        description="Questões de múltipla escolha, numéricas (com tolerância) e abertas, com LaTeX."
        actions={
          <>
            <ButtonLink href="/atividades/correcao" variant={pendingOpen ? "primary" : "secondary"}>
              <ClipboardCheck className="size-4" aria-hidden /> Correção de abertas ({pendingOpen})
            </ButtonLink>
            <ButtonLink href="/atividades/nova">
              <Plus className="size-4" aria-hidden /> Nova atividade
            </ButtonLink>
          </>
        }
      />
      {withActivities.length === 0 ? (
        <EmptyState>Nenhuma atividade cadastrada.</EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {withActivities.map((course) => (
            <Card key={course.id}>
              <CardTitle>{course.title}</CardTitle>
              <ul className="flex flex-col gap-2">
                {course.modules.flatMap((m) =>
                  m.activities.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/atividades/${a.id}`}
                        className="group rounded-btn border-border bg-surface-2 hover:border-accent flex items-center gap-3 border p-3"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="group-hover:text-accent flex flex-wrap items-center gap-2 text-sm font-medium">
                            {a.title}
                            <Badge tone={DIFFICULTY_TONE[a.difficulty]}>
                              {DIFFICULTIES[a.difficulty]}
                            </Badge>
                            {a.isPreview ? <Badge tone="success">grátis</Badge> : null}
                            {a.status === "draft" ? <Badge>rascunho</Badge> : null}
                          </span>
                          <span className="text-muted block text-xs">
                            {m.title} · {a._count.questions} questão(ões) · {a._count.attempts}{" "}
                            tentativa(s)
                          </span>
                        </span>
                        <ChevronRight className="text-muted size-4" aria-hidden />
                      </Link>
                    </li>
                  )),
                )}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
