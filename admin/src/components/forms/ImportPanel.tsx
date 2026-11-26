"use client";

import { CloudDownload, FileUp, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { applyImport, previewLattes, previewOrcid } from "@/actions/publications";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { FormMessage } from "@/components/ui/FormMessage";
import { PUBLICATION_TYPES } from "@/lib/labels";
import type { ActionState } from "@/types/action";
import type { PreviewItem, PreviewResult } from "@/types/publication";

type Preview = Extract<PreviewResult, { ok: true }>;

const STATUS_BADGE = {
  new: <Badge tone="success">nova</Badge>,
  changed: <Badge tone="warning">alterada</Badge>,
  unchanged: <Badge>igual</Badge>,
};

/** Item marcado por padrão: novos e alterados, exceto prováveis duplicatas. */
function selectedByDefault(entry: PreviewItem): boolean {
  return entry.status !== "unchanged" && !entry.duplicate;
}

/**
 * Importação do Lattes (XML/ZIP) e do ORCID com prévia (RN15): o admin vê o
 * que é novo, o que mudou e as duplicatas por DOI, e escolhe o que gravar.
 */
export function ImportPanel({ orcidLabel }: { orcidLabel: string | null }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<ActionState>({ ok: false });
  const [pending, startTransition] = useTransition();

  function showPreview(result: PreviewResult): void {
    if (!result.ok) {
      setPreview(null);
      setMessage({ ok: false, message: result.message });
      return;
    }
    setMessage({ ok: false });
    setPreview(result);
    setSelected(
      new Set(result.items.filter(selectedByDefault).map((entry) => entry.item.externalId)),
    );
  }

  function toggle(externalId: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(externalId)) next.delete(externalId);
      else next.add(externalId);
      return next;
    });
  }

  function save(): void {
    if (!preview) return;
    const items = preview.items
      .filter((entry) => selected.has(entry.item.externalId))
      .map((entry) => entry.item);
    startTransition(async () => {
      const result = await applyImport({
        source: preview.source,
        fileName: preview.fileName,
        totalInPreview: preview.items.length,
        lattesUpdatedAt: preview.lattesUpdatedAt,
        items,
      });
      setMessage(result);
      if (result.ok) setPreview(null);
    });
  }

  const counts = preview
    ? {
        new: preview.items.filter((e) => e.status === "new").length,
        changed: preview.items.filter((e) => e.status === "changed").length,
        unchanged: preview.items.filter((e) => e.status === "unchanged").length,
        duplicates: preview.items.filter((e) => e.duplicate).length,
      }
    : null;

  return (
    <div className="flex flex-col gap-6" aria-busy={pending}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Currículo Lattes</CardTitle>
          <p className="text-muted mb-4 text-sm">
            Na Plataforma Lattes, abra seu currículo e use <strong>Exportar → XML</strong>. Envie o
            .xml ou o .zip baixado.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              startTransition(async () => showPreview(await previewLattes(formData)));
            }}
            className="flex flex-wrap items-center gap-3"
          >
            <input
              name="file"
              type="file"
              accept=".xml,.zip,text/xml,application/xml,application/zip"
              aria-label="Arquivo XML do Lattes"
              className="text-muted file:rounded-btn file:border-accent file:text-accent text-sm file:mr-3 file:border file:bg-transparent file:px-3 file:py-2"
            />
            <Button type="submit" variant="secondary" disabled={pending}>
              <FileUp className="size-4" aria-hidden /> Ver prévia
            </Button>
          </form>
        </Card>
        <Card>
          <CardTitle>ORCID</CardTitle>
          <p className="text-muted mb-4 text-sm">
            {orcidLabel
              ? `Lê as publicações públicas do ${orcidLabel}.`
              : "Cadastre seu ORCID iD no Perfil para sincronizar."}
          </p>
          <Button
            variant="secondary"
            disabled={pending || !orcidLabel}
            onClick={() => startTransition(async () => showPreview(await previewOrcid()))}
          >
            <CloudDownload className="size-4" aria-hidden /> Buscar no ORCID
          </Button>
        </Card>
      </div>

      <FormMessage state={message} />
      {pending && !preview ? <p className="text-muted text-sm">Lendo publicações...</p> : null}

      {preview && counts ? (
        <Card>
          <CardTitle
            actions={
              <Button onClick={save} disabled={pending || selected.size === 0}>
                <Save className="size-4" aria-hidden /> Gravar {selected.size} selecionada(s)
              </Button>
            }
          >
            Prévia — {preview.sourceLabel}
          </CardTitle>
          <p className="text-muted mb-4 text-sm">
            {counts.new} nova(s) · {counts.changed} alterada(s) · {counts.unchanged} igual(is) ·{" "}
            {counts.duplicates} provável(is) duplicata(s) por DOI. Duplicatas e itens iguais vêm
            desmarcados.
          </p>
          <ul className="flex flex-col gap-2">
            {preview.items.map((entry) => {
              const id = entry.item.externalId;
              const disabled = entry.status === "unchanged";
              return (
                <li
                  key={id}
                  className={`rounded-btn border-border border p-3 ${disabled ? "opacity-50" : ""}`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="accent-accent mt-1 size-4"
                      checked={selected.has(id)}
                      disabled={disabled}
                      onChange={() => toggle(id)}
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        {entry.item.title}
                        {STATUS_BADGE[entry.status]}
                        {entry.duplicate ? (
                          <Badge tone="danger">DOI já existe ({entry.duplicate.source})</Badge>
                        ) : null}
                      </span>
                      <span className="text-muted block text-xs">
                        {entry.item.year} · {PUBLICATION_TYPES[entry.item.type]} ·{" "}
                        {entry.item.authors}
                        {entry.item.venue ? ` · ${entry.item.venue}` : ""}
                        {entry.item.doi ? ` · DOI ${entry.item.doi}` : ""}
                      </span>
                      {entry.changes.length ? (
                        <span className="text-warning block text-xs">
                          Mudou: {entry.changes.join(", ")}
                        </span>
                      ) : null}
                      {entry.duplicate ? (
                        <span className="text-danger block text-xs">
                          Parece ser: “{entry.duplicate.title}”
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
