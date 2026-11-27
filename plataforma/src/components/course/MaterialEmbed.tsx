"use client";

import { ChevronDown, ExternalLink, Eye } from "lucide-react";
import { useState } from "react";

/**
 * Material por link do Google Drive/Docs: "Ver aqui" abre o arquivo embutido
 * na página (o iframe só carrega ao abrir) e "Nova aba" abre fora.
 * @param title Título do material (nome do iframe).
 * @param embedUrl Endereço de incorporação (…/preview).
 * @param openUrl Endereço para a nova aba.
 */
export function MaterialEmbed({
  title,
  embedUrl,
  openUrl,
}: {
  title: string;
  embedUrl: string;
  openUrl: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="text-accent inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          <Eye className="size-4" aria-hidden />
          {open ? "Fechar" : "Ver aqui"}
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted hover:text-text inline-flex items-center gap-1 text-sm"
        >
          Nova aba <ExternalLink className="size-4" aria-hidden />
        </a>
      </span>
      {open ? (
        <div className="rounded-btn border-border bg-surface-2 w-full basis-full overflow-hidden border">
          <iframe
            src={embedUrl}
            title={title}
            allow="autoplay"
            className="h-[70vh] min-h-96 w-full"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : null}
    </>
  );
}
