"use client";

import { CheckCircle2, RotateCcw, Send, XCircle } from "lucide-react";
import { useState, useTransition, type ReactNode } from "react";
import { submitActivity } from "@/actions/activity";
import { Button } from "@portfolio/ui/Button";
import { Markdown } from "@portfolio/ui/Markdown";
import type { GradeResult, QuestionResult } from "@/lib/activity";

/** Questão como o navegador recebe: sem gabarito. */
export type RunnerQuestion = {
  id: number;
  type: "multiple_choice" | "numeric" | "open";
  points: number;
  unit: string | null;
  statement: ReactNode;
  imageUrl: string | null;
  options: { id: number; text: string }[];
};

type Draft = Record<number, { optionId?: number; value?: string; text?: string }>;

const input =
  "h-11 w-full max-w-xs rounded-btn border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent focus:outline-none";

/** Responde a atividade e mostra a correção feita no servidor. */
export function ActivityRunner({
  activityId,
  questions,
}: {
  activityId: number;
  questions: RunnerQuestion[];
}) {
  const [draft, setDraft] = useState<Draft>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const byQuestion = new Map<number, QuestionResult>(
    result?.results.map((r) => [r.questionId, r]) ?? [],
  );

  function update(questionId: number, patch: Draft[number]): void {
    setDraft((current) => ({ ...current, [questionId]: { ...current[questionId], ...patch } }));
  }

  function submit(): void {
    setError(null);
    const answers = questions.map((q) => ({
      questionId: q.id,
      optionId: draft[q.id]?.optionId ?? null,
      value: draft[q.id]?.value ?? null,
      text: draft[q.id]?.text ?? null,
    }));
    startTransition(async () => {
      const response = await submitActivity({ activityId, answers });
      if (response.ok) {
        setResult(response.result);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else setError(response.message);
    });
  }

  function restart(): void {
    setDraft({});
    setResult(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {result ? (
        <div
          role="status"
          className="rounded-card border-accent/50 bg-accent/10 flex flex-wrap items-center justify-between gap-4 border p-5"
        >
          <div>
            <p className="text-muted text-sm">Seu resultado</p>
            <p className="text-accent text-3xl font-bold">
              {result.maxScore ? Math.round((result.score / result.maxScore) * 100) : 0}%
            </p>
            <p className="text-muted text-sm">
              {result.score.toLocaleString("pt-BR")} de {result.maxScore.toLocaleString("pt-BR")}{" "}
              ponto(s)
              {result.revealed ? "" : " · a resolução não é mostrada nesta atividade"}
            </p>
          </div>
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="size-4" aria-hidden /> Refazer
          </Button>
        </div>
      ) : null}

      <ol className="flex flex-col gap-5">
        {questions.map((q, index) => {
          const r = byQuestion.get(q.id);
          const border =
            r?.status === "correct"
              ? "border-success/60"
              : r?.status === "wrong"
                ? "border-danger/60"
                : "border-border";
          return (
            <li key={q.id} className={`rounded-card border ${border} bg-surface p-5 sm:p-6`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-accent text-sm font-semibold">Questão {index + 1}</p>
                <p className="text-muted text-xs">{q.points.toLocaleString("pt-BR")} ponto(s)</p>
              </div>
              {q.statement}
              {q.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- imagem do storage
                <img
                  src={q.imageUrl}
                  alt={`Figura da questão ${index + 1}`}
                  className="rounded-btn border-border mt-4 max-h-80 border"
                />
              ) : null}

              {q.type === "multiple_choice" ? (
                <fieldset className="mt-4 flex flex-col gap-2" disabled={!!result}>
                  <legend className="sr-only">Alternativas da questão {index + 1}</legend>
                  {q.options.map((option, i) => {
                    const chosen = draft[q.id]?.optionId === option.id;
                    const isRight = r?.correctOptionIds?.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className={`rounded-btn flex cursor-pointer items-start gap-3 border p-3 text-sm transition-colors ${
                          isRight
                            ? "border-success bg-success/10"
                            : chosen
                              ? "border-accent bg-accent/10"
                              : "border-border hover:border-accent/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          className="accent-accent mt-0.5"
                          checked={chosen}
                          onChange={() => update(q.id, { optionId: option.id })}
                        />
                        <span>
                          <span className="mr-2 font-semibold">{String.fromCharCode(65 + i)})</span>
                          {option.text}
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              ) : null}

              {q.type === "numeric" ? (
                <div className="mt-4 flex items-center gap-2">
                  <label htmlFor={`q-${q.id}`} className="sr-only">
                    Resposta da questão {index + 1}
                  </label>
                  <input
                    id={`q-${q.id}`}
                    inputMode="decimal"
                    placeholder="Sua resposta"
                    className={input}
                    value={draft[q.id]?.value ?? ""}
                    disabled={!!result}
                    onChange={(event) => update(q.id, { value: event.target.value })}
                  />
                  {q.unit ? <span className="text-muted text-sm">{q.unit}</span> : null}
                </div>
              ) : null}

              {q.type === "open" ? (
                <div className="mt-4">
                  <label htmlFor={`q-${q.id}`} className="sr-only">
                    Resposta da questão {index + 1}
                  </label>
                  <textarea
                    id={`q-${q.id}`}
                    rows={4}
                    placeholder="Escreva sua resposta"
                    className="rounded-btn border-border bg-surface-2 focus:border-accent w-full border p-3 text-sm focus:outline-none"
                    value={draft[q.id]?.text ?? ""}
                    disabled={!!result}
                    onChange={(event) => update(q.id, { text: event.target.value })}
                  />
                </div>
              ) : null}

              {r ? <Feedback result={r} /> : null}
            </li>
          );
        })}
      </ol>

      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      {result ? null : (
        <div>
          <Button onClick={submit} disabled={pending}>
            <Send className="size-4" aria-hidden /> {pending ? "Corrigindo..." : "Enviar respostas"}
          </Button>
        </div>
      )}
    </div>
  );
}

/** Certo/errado, gabarito e resolução (quando a atividade revela). */
function Feedback({ result }: { result: QuestionResult }) {
  if (result.status === "ungraded") {
    return (
      <p className="rounded-btn bg-surface-2 text-muted mt-4 p-3 text-sm">
        Questão aberta: a correção é feita pelo professor, para assinantes.
      </p>
    );
  }
  const correct = result.status === "correct";
  return (
    <div className="rounded-btn bg-surface-2 mt-4 flex flex-col gap-2 p-4 text-sm">
      <p
        className={`flex items-center gap-2 font-semibold ${correct ? "text-success" : "text-danger"}`}
      >
        {correct ? (
          <CheckCircle2 className="size-4" aria-hidden />
        ) : (
          <XCircle className="size-4" aria-hidden />
        )}
        {correct ? "Resposta correta" : "Resposta incorreta"}
      </p>
      {result.feedback ? <p className="text-muted">{result.feedback}</p> : null}
      {result.expected && !correct ? (
        <p className="text-muted">Resposta esperada: {result.expected}</p>
      ) : null}
      {result.explanation ? (
        <div>
          <p className="font-medium">Resolução</p>
          <Markdown source={result.explanation} className="text-muted" />
        </div>
      ) : null}
    </div>
  );
}
