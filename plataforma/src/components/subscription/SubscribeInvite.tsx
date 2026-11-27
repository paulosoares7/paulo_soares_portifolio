"use client";

import { useEffect, useId, useRef } from "react";
import { Sparkles, X } from "lucide-react";
import { Button, ButtonLink } from "@portfolio/ui/Button";
import { formatMoney } from "@/lib/format";

/**
 * Convite para assinar, aberto ao entrar na última aula grátis de uma
 * disciplina. Aparece uma vez por disciplina a cada visita (sessionStorage):
 * quem fecha continua assistindo sem ser interrompido de novo ao recarregar.
 * O cartão fixo abaixo do vídeo (SubscribeCta) continua na página.
 */
export function SubscribeInvite({
  courseId,
  courseTitle,
  plan,
}: {
  courseId: number;
  courseTitle: string;
  plan: { priceCents: number; maxCourses: number } | null;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const storageKey = `convite-assinatura-${courseId}`;

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(storageKey) === "1";
    } catch {
      // Sem acesso ao armazenamento (janela anônima, bloqueio): mostra o convite.
    }
    if (!seen && !dialog.current?.open) dialog.current?.showModal();
  }, [storageKey]);

  function close(): void {
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      // Sem armazenamento, o convite só volta a aparecer ao recarregar.
    }
    dialog.current?.close();
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={close}
      className="rounded-card border-border bg-surface text-text backdrop:bg-overlay m-auto w-[calc(100%-2rem)] max-w-md border p-6 shadow-xl"
    >
      <button
        type="button"
        onClick={close}
        aria-label="Fechar"
        className="text-muted hover:text-text absolute top-3 right-3 rounded-full p-1.5"
      >
        <X className="size-5" aria-hidden />
      </button>
      <span className="border-accent/40 bg-accent/10 text-accent flex size-12 items-center justify-center rounded-full border">
        <Sparkles className="size-6" aria-hidden />
      </span>
      <h2 id={titleId} className="mt-4 text-xl font-semibold">
        Esta é a última aula grátis de {courseTitle}
      </h2>
      <p className="text-muted mt-2 text-sm leading-relaxed">
        {plan
          ? `Gostou? Com a assinatura de ${formatMoney(plan.priceCents)} por mês você libera todas as aulas, atividades e materiais de até ${plan.maxCourses} disciplinas à sua escolha.`
          : "Gostou? Com a assinatura você libera todas as aulas, atividades e materiais das suas disciplinas."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/assinar">Quero assinar</ButtonLink>
        <Button type="button" variant="outline" onClick={close}>
          Continuar assistindo
        </Button>
      </div>
    </dialog>
  );
}
