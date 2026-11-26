"use client";

import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { regenerateCode } from "@/actions/students";
import { Button } from "@/components/ui/Button";
import { CodeReveal } from "@/components/ui/CodeReveal";
import type { CodeActionState } from "@/types/action";

/** Gera um código novo para o aluno e mostra uma única vez. */
export function RegenerateCodeButton({ studentId }: { studentId: number }) {
  const [result, setResult] = useState<CodeActionState | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            if (
              !window.confirm(
                "Gerar um código novo? O código atual deixa de funcionar e as sessões dele são encerradas.",
              )
            )
              return;
            startTransition(async () => setResult(await regenerateCode(studentId)));
          }}
        >
          <KeyRound className="size-4" aria-hidden /> Gerar novo código
        </Button>
      </div>
      {result?.ok && result.code ? (
        <CodeReveal code={result.code} emailed={result.emailed} />
      ) : null}
      {result && !result.ok ? (
        <p role="alert" className="text-danger text-sm">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
