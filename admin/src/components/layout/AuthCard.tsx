import type { ReactNode } from "react";

/** Moldura das telas sem sessão (login e senha): cartão centralizado. */
export function AuthCard({
  description,
  children,
}: {
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="rounded-card border-border bg-surface w-full max-w-sm border p-8">
        <h1 className="text-2xl font-semibold">
          Painel<span className="text-accent">.</span>
        </h1>
        <p className="text-muted mt-1 mb-6 text-sm">{description}</p>
        {children}
      </div>
    </main>
  );
}
