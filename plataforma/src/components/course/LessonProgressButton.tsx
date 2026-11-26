"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { markLessonCompleted, trackLessonView } from "@/actions/progress";

/**
 * Botão "Marcar como concluída" da aula. Ao abrir a página, registra a aula
 * como vista (para o "continuar de onde parou" da Minha área).
 * @param lessonId Aula.
 * @param initialDone Já concluída?
 */
export function LessonProgressButton({
  lessonId,
  initialDone,
}: {
  lessonId: number;
  initialDone: boolean;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, startTransition] = useTransition();
  const tracked = useRef(false);

  useEffect(() => {
    // Uma vez por aula aberta (o modo estrito do React roda efeitos 2x no dev).
    if (tracked.current) return;
    tracked.current = true;
    void trackLessonView(lessonId);
  }, [lessonId]);

  function toggle(): void {
    const next = !done;
    setDone(next);
    startTransition(async () => {
      const result = await markLessonCompleted(lessonId, next);
      if (!result.ok) setDone(!next);
    });
  }

  const Icon = done ? CheckCircle2 : Circle;
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={done}
      className={`rounded-btn inline-flex h-10 items-center gap-2 border px-4 text-sm font-medium transition-colors disabled:opacity-60 ${
        done
          ? "border-success/60 bg-success/10 text-success"
          : "border-border text-text hover:border-accent hover:text-accent"
      }`}
    >
      <Icon className="size-4" aria-hidden />
      {done ? "Aula concluída" : "Marcar como concluída"}
    </button>
  );
}
