import type { Metadata } from "next";
import { prisma } from "@portfolio/database";
import { GradeAnswerForm } from "@/components/forms/GradeAnswerForm";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarkdownPreview } from "@/components/ui/MarkdownEditor";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Correção de abertas" };

/** Fila de respostas abertas aguardando correção manual (RF28). */
export default async function GradingPage() {
  const answers = await prisma.attemptAnswer.findMany({
    where: { isCorrect: null, question: { type: "open" }, attempt: { submittedAt: { not: null } } },
    orderBy: { attempt: { submittedAt: "asc" } },
    take: 100,
    include: {
      question: { select: { statement: true, points: true, explanation: true } },
      attempt: {
        select: {
          submittedAt: true,
          student: { select: { name: true } },
          activity: {
            select: { title: true, module: { select: { course: { select: { title: true } } } } },
          },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Correção de abertas"
        back={{ href: "/atividades", label: "Atividades" }}
        description="Respostas mais antigas primeiro. A nota da tentativa é recalculada a cada correção."
      />
      {answers.length === 0 ? (
        <EmptyState>Nenhuma resposta aberta aguardando correção.</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {answers.map((answer) => (
            <Card key={answer.id}>
              <p className="text-muted text-xs">
                {answer.attempt.activity.module.course.title} › {answer.attempt.activity.title} ·{" "}
                {answer.attempt.student.name} · {formatDateTime(answer.attempt.submittedAt)}
              </p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-muted mb-1 text-xs font-medium uppercase">Enunciado</p>
                  <MarkdownPreview source={answer.question.statement} />
                  {answer.question.explanation ? (
                    <>
                      <p className="text-muted mt-3 mb-1 text-xs font-medium uppercase">
                        Resolução esperada
                      </p>
                      <MarkdownPreview source={answer.question.explanation} />
                    </>
                  ) : null}
                </div>
                <div>
                  <p className="text-muted mb-1 text-xs font-medium uppercase">Resposta do aluno</p>
                  <p className="rounded-btn border-border bg-surface-2 border p-3 text-sm whitespace-pre-wrap">
                    {answer.textValue || "(em branco)"}
                  </p>
                </div>
              </div>
              <div className="border-border mt-4 border-t pt-4">
                <GradeAnswerForm
                  answerId={answer.id}
                  maxPoints={answer.question.points.toString().replace(".", ",")}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
