"use client";

import { Copy, KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

/** Mostra o código de acesso UMA vez (o banco só guarda o hash). */
export function CodeReveal({ code, emailed }: { code: string; emailed?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      role="status"
      className="rounded-card border-success/50 bg-success/10 flex flex-col gap-2 border p-4"
    >
      <p className="text-success flex items-center gap-2 text-sm font-medium">
        <KeyRound className="size-4" aria-hidden /> Código gerado — anote agora, ele não aparece de
        novo:
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <code className="text-text text-xl font-semibold tracking-widest" data-testid="access-code">
          {code}
        </code>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(code).then(() => setCopied(true));
          }}
        >
          <Copy className="size-4" aria-hidden /> {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <p className="text-muted text-xs">
        {emailed
          ? "Também foi enviado ao e-mail do aluno."
          : "E-mail não configurado (Resend): entregue o código ao aluno."}
      </p>
    </div>
  );
}
