import { ExternalLink, FileText, Lock } from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import type { Access } from "@/lib/access";
import { MATERIAL_TYPES } from "@/lib/labels";

/** Material como a página recebe (link só vem quando há acesso e não é PDF). */
export type MaterialItem = {
  id: number;
  type: keyof typeof MATERIAL_TYPES;
  title: string;
  description: string | null;
  where: string;
  access: Access;
  isPdf: boolean;
  openUrl: string | null;
};

/**
 * Lista de materiais. PDF nunca vira link de download (RN12): ele será aberto
 * no visualizador com marca d'água (fase 4). Pagos aparecem com cadeado.
 */
export function MaterialList({ items }: { items: MaterialItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-card border-border text-muted border border-dashed px-4 py-10 text-center">
        Nenhum material nesta disciplina ainda.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {items.map((m) => (
        <li key={m.id} className="rounded-btn bg-surface-2 flex flex-wrap items-center gap-4 p-4">
          <span
            aria-hidden
            className={`rounded-btn flex size-10 shrink-0 items-center justify-center ${m.access === "locked" ? "bg-border/40 text-muted" : "bg-accent/15 text-accent"}`}
          >
            {m.access === "locked" ? <Lock className="size-5" /> : <FileText className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{m.title}</p>
            <p className="text-muted text-xs">
              {MATERIAL_TYPES[m.type]} · {m.where}
            </p>
            {m.description ? <p className="text-muted mt-1 text-sm">{m.description}</p> : null}
          </div>
          {m.access === "locked" ? (
            <span className="text-muted inline-flex items-center gap-1 text-xs">
              <Lock className="size-3.5" aria-hidden /> Assinantes
            </span>
          ) : m.openUrl ? (
            <a
              href={m.openUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent inline-flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Abrir <ExternalLink className="size-4" aria-hidden />
            </a>
          ) : (
            <span className="flex items-center gap-2">
              {m.access === "free" ? <Badge tone="success">Grátis</Badge> : null}
              <span className="text-muted text-xs">Visualizador em breve</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
