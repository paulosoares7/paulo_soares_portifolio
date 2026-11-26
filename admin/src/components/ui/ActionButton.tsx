"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import type { ActionState } from "@/types/action";

type ActionButtonProps = {
  /** Server action já com os argumentos (ex.: deleteCategory.bind(null, id)). */
  action: () => Promise<ActionState>;
  children: ReactNode;
  /** Pergunta de confirmação antes de executar. */
  confirm?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  title?: string;
};

/** Botão que executa uma server action e mostra a mensagem devolvida (erro ou sucesso). */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "ghost",
  size = "sm",
  title,
}: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState | null>(null);

  function run(): void {
    if (confirm && !window.confirm(confirm)) return;
    startTransition(async () => {
      const next = await action();
      setResult(next.ok ? next : { ok: false, message: next.message ?? "Falhou." });
    });
  }

  return (
    <span className="inline-flex flex-col items-end">
      <Button
        variant={variant}
        size={size}
        onClick={run}
        disabled={pending}
        title={title}
        aria-label={title}
      >
        {children}
      </Button>
      {result?.message ? (
        <span
          role={result.ok ? "status" : "alert"}
          className={`mt-1 max-w-64 text-right text-xs ${result.ok ? "text-success" : "text-danger"}`}
        >
          {result.message}
        </span>
      ) : null}
    </span>
  );
}
