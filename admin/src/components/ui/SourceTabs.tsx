"use client";

import { Link2, Upload } from "lucide-react";

/** Forma de adicionar: arquivo enviado ao storage ou link externo. */
export type SourceMode = "file" | "link";

/**
 * Escolha entre "Enviar arquivo" e "Colar link externo" (dois botões lado a
 * lado; o escolhido fica destacado).
 * @param mode Opção atual.
 * @param onChange Troca de opção.
 * @param label Nome do grupo para leitores de tela.
 */
export function SourceTabs({
  mode,
  onChange,
  label,
}: {
  mode: SourceMode;
  onChange: (mode: SourceMode) => void;
  label: string;
}) {
  const options = [
    { value: "file" as const, text: "Enviar arquivo", icon: Upload },
    { value: "link" as const, text: "Colar link externo", icon: Link2 },
  ];
  return (
    <div
      role="group"
      aria-label={label}
      className="rounded-btn border-border bg-surface-2 inline-flex w-fit border p-0.5"
    >
      {options.map(({ value, text, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
          className={`rounded-btn inline-flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
            mode === value ? "bg-accent/15 text-accent font-medium" : "text-muted hover:text-text"
          }`}
        >
          <Icon className="size-4" aria-hidden />
          {text}
        </button>
      ))}
    </div>
  );
}
