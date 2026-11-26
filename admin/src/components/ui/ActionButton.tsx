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

/** Botão que executa uma server action e mostra o erro, se houver. */
export function ActionButton({
  action,
  children,
  confirm,
  variant = "ghost",
  size = "sm",
  title,
}: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(): void {
    if (confirm && !window.confirm(confirm)) return;
    startTransition(async () => {
      const result = await action();
      setError(result.ok ? null : (result.message ?? "Falhou."));
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
      {error ? (
        <span role="alert" className="text-danger mt-1 max-w-64 text-right text-xs">
          {error}
        </span>
      ) : null}
    </span>
  );
}
