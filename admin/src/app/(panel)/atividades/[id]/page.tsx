import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import { deleteActivity, deleteQuestion, reorderQuestions } from "@/actions/activities";
import { ActivityForm } from "@/components/forms/ActivityForm";
import { QuestionForm } from "@/components/forms/QuestionForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarkdownPreview } from "@/components/ui/MarkdownEditor";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";
import { loadCourseTree } from "@/lib/course-tree";
import { QUESTION_TYPES } from "@/lib/labels";
import { isStorageConfigured } from "@/lib/storage";

export const metadata: Metadata = { title: "Atividade" };

/** Decimal do Prisma como texto do formulário ("1,50"). */
function decimalInput(value: { toString(): string } | null): string {
  return value ? value.toString().replace(".", ",") : "";
}

/** Atividade: dados + questões com gabarito, arrastar para ordenar (RF28). */
export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [activity, tree] = await Promise.all([
    prisma.activity.findUnique({
      where: { id },
      include: {
        module: { select: { title: true, course: { select: { title: true } } } },
        questions: {
          orderBy: { sortOrder: "asc" },
          include: { options: { orderBy: { sortOrder: "asc" } }, imageFile: true },
        },
        _count: { select: { attempts: true } },
      },
    }),
    loadCourseTree(),
  ]);
  if (!activity) notFound();
  const storageReady = isStorageConfigured();
  const totalPoints = activity.questions.reduce((sum, q) => sum + Number(q.points), 0);

  return (
    <>
      <PageHeader
        title={activity.title}
        back={{ href: "/atividades", label: "Atividades" }}
        description={`${activity.module.course.title} › ${activity.module.title} · ${activity.questions.length} questão(ões) · ${totalPoints.toLocaleString("pt-BR")} ponto(s) · ${activity._count.attempts} tentativa(s)`}
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle
            actions={
              <ModalTrigger
                label={
                  <>
                    <Plus className="size-4" aria-hidden /> Nova questão
                  </>
                }
                title="Nova questão"
                variant="primary"
                wide
              >
                <QuestionForm activityId={activity.id} storageReady={storageReady} />
              </ModalTrigger>
            }
          >
            Questões
          </CardTitle>
          <SortableList
            onReorder={reorderQuestions.bind(null, activity.id)}
            empty={<EmptyState>Nenhuma questão. Use &quot;Nova questão&quot;.</EmptyState>}
            items={activity.questions.map((q, index) => ({
              id: q.id,
              content: (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      Questão {index + 1}
                      <Badge tone="accent">{QUESTION_TYPES[q.type]}</Badge>
                      <Badge>{decimalInput(q.points)} pt</Badge>
                      {q.imageFile ? <Badge>com figura</Badge> : null}
                    </p>
                    <div className="flex gap-1">
                      <ModalTrigger
                        label={<Pencil className="size-4" aria-hidden />}
                        title={`Editar questão ${index + 1}`}
                        variant="ghost"
                        wide
                        ariaLabel={`Editar questão ${index + 1}`}
                      >
                        <QuestionForm
                          activityId={activity.id}
                          storageReady={storageReady}
                          item={{
                            id: q.id,
                            type: q.type,
                            statement: q.statement,
                            imageFileId: q.imageFileId,
                            imageName: q.imageFile?.originalName ?? null,
                            points: decimalInput(q.points),
                            numericAnswer: decimalInput(q.numericAnswer),
                            tolerancePct: decimalInput(q.tolerancePct),
                            unit: q.unit ?? "",
                            explanation: q.explanation ?? "",
                            options: q.options.map((o) => ({
                              id: o.id,
                              text: o.text,
                              isCorrect: o.isCorrect,
                              feedback: o.feedback ?? "",
                            })),
                          }}
                        />
                      </ModalTrigger>
                      <ActionButton
                        action={deleteQuestion.bind(null, q.id)}
                        confirm={`Apagar a questão ${index + 1}?`}
                        title={`Remover questão ${index + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </ActionButton>
                    </div>
                  </div>
                  <MarkdownPreview source={q.statement} />
                  {q.type === "multiple_choice" ? (
                    <ol className="flex flex-col gap-1 text-sm">
                      {q.options.map((o, i) => (
                        <li key={o.id} className={o.isCorrect ? "text-success" : "text-muted"}>
                          {String.fromCharCode(65 + i)}) {o.text} {o.isCorrect ? "✓" : ""}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {q.type === "numeric" ? (
                    <p className="text-success text-sm">
                      Gabarito: {decimalInput(q.numericAnswer)} {q.unit} (±
                      {decimalInput(q.tolerancePct) || "0"}%)
                    </p>
                  ) : null}
                </div>
              ),
            }))}
          />
        </Card>

        <Card>
          <CardTitle>Dados da atividade</CardTitle>
          <ActivityForm
            tree={tree}
            item={{
              id: activity.id,
              moduleId: activity.moduleId,
              title: activity.title,
              instructions: activity.instructions ?? "",
              difficulty: activity.difficulty,
              maxAttempts: activity.maxAttempts?.toString() ?? "",
              showAnswers: activity.showAnswers,
              isPreview: activity.isPreview,
              status: activity.status,
            }}
          />
        </Card>

        <Card className="border-danger/40">
          <CardTitle>Apagar atividade</CardTitle>
          <ActionButton
            action={deleteActivity.bind(null, activity.id)}
            confirm="Apagar a atividade com todas as questões e as tentativas dos alunos?"
            variant="danger"
            size="md"
          >
            <Trash2 className="size-4" aria-hidden /> Apagar atividade
          </ActionButton>
        </Card>
      </div>
    </>
  );
}
