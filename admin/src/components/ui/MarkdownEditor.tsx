"use client";

import "katex/dist/katex.min.css";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { Textarea } from "@/components/ui/Field";

type MarkdownEditorProps = {
  id: string;
  name: string;
  defaultValue?: string;
  invalid?: boolean;
  rows?: number;
};

/** Renderiza Markdown + LaTeX ($...$ e $$...$$) como o site vai mostrar. */
export function MarkdownPreview({ source }: { source: string }) {
  return (
    <div className="prose-admin text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {source}
      </ReactMarkdown>
    </div>
  );
}

/**
 * Editor de texto com abas Escrever / Prévia. Aceita Markdown e LaTeX:
 * $v = \frac{\Delta s}{\Delta t}$ na linha ou $$...$$ em bloco.
 */
export function MarkdownEditor({
  id,
  name,
  defaultValue = "",
  invalid,
  rows = 8,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");

  return (
    <div className="flex flex-col gap-2">
      <div role="tablist" className="flex gap-1 text-xs">
        {(["write", "preview"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-btn px-3 py-1 ${tab === key ? "bg-accent/15 text-accent" : "text-muted hover:text-text"}`}
          >
            {key === "write" ? "Escrever" : "Prévia"}
          </button>
        ))}
      </div>
      {/* O textarea fica sempre no formulário (escondido na prévia) para ser enviado. */}
      <Textarea
        id={id}
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={rows}
        invalid={invalid}
        className={`font-mono ${tab === "preview" ? "hidden" : ""}`}
      />
      {tab === "preview" ? (
        <div className="rounded-btn border-border bg-surface-2 min-h-24 border p-3">
          {value.trim() ? (
            <MarkdownPreview source={value} />
          ) : (
            <p className="text-muted text-sm">Nada para mostrar.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
