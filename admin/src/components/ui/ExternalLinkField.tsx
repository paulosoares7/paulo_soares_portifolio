"use client";

import { AlertTriangle, CheckCircle2, Link2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { useState, useTransition } from "react";
import {
  isHttpsUrl,
  LINK_SOURCE_LABELS,
  linkSource,
  normalizeExternalUrl,
} from "@portfolio/database/external-link";
import { testExternalLink } from "@/actions/links";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

type ExternalLinkFieldProps = {
  id: string;
  name: string;
  defaultValue?: string;
  /** Erro do servidor (Zod). */
  error?: string[];
  /** Material: avisa que o link não tem a proteção dos PDFs enviados. */
  protectionWarning?: boolean;
  /** Chamado a cada mudança (formulários fora do <form> principal). */
  onValueChange?: (value: string) => void;
};

/**
 * Campo "Colar link externo": aceita Google Drive, OneDrive, Dropbox ou site
 * (só https), mostra de onde é o link, como o Drive será salvo, os avisos
 * (Discord e proteção) e o botão "Testar link".
 */
export function ExternalLinkField({
  id,
  name,
  defaultValue = "",
  error,
  protectionWarning,
  onValueChange,
}: ExternalLinkFieldProps) {
  const [value, setValue] = useState(defaultValue);
  const [blurred, setBlurred] = useState(false);
  const [check, setCheck] = useState<{ ok: boolean; message: string } | null>(null);
  const [testing, startTesting] = useTransition();

  const trimmed = value.trim();
  const valid = isHttpsUrl(trimmed);
  const source = valid ? linkSource(trimmed) : null;
  const normalized = valid ? normalizeExternalUrl(trimmed) : "";
  const localError =
    blurred && trimmed && !valid ? "Informe um endereço completo começando com https://." : null;
  const shownError = localError ?? error?.[0] ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-start gap-2">
        <Input
          id={id}
          name={name}
          type="url"
          inputMode="url"
          placeholder="https://drive.google.com/file/d/..."
          value={value}
          invalid={Boolean(shownError)}
          aria-describedby={shownError ? `${id}-error` : undefined}
          className="min-w-0 flex-1"
          onChange={(event) => {
            setValue(event.target.value);
            setCheck(null);
            onValueChange?.(event.target.value);
          }}
          onBlur={() => setBlurred(true)}
        />
        <Button
          variant="secondary"
          size="md"
          disabled={!valid || testing}
          onClick={() =>
            startTesting(async () => setCheck(await testExternalLink(normalized || trimmed)))
          }
        >
          {testing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Link2 className="size-4" aria-hidden />
          )}
          Testar link
        </Button>
      </div>

      {shownError ? (
        <p id={`${id}-error`} className="text-danger text-xs">
          {shownError}
        </p>
      ) : null}
      {source ? (
        <p className="text-muted text-xs">
          {LINK_SOURCE_LABELS[source]}
          {normalized !== trimmed ? ` · será salvo no formato de visualização: ${normalized}` : ""}
        </p>
      ) : null}
      {check ? (
        <p
          role="status"
          className={`flex items-center gap-1.5 text-xs ${check.ok ? "text-success" : "text-danger"}`}
        >
          {check.ok ? (
            <CheckCircle2 className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <XCircle className="size-3.5 shrink-0" aria-hidden />
          )}
          {check.message}
        </p>
      ) : null}
      {source === "discord" ? (
        <p className="rounded-btn border-warning/50 bg-warning/10 text-warning flex items-start gap-2 border px-3 py-2 text-xs">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Links de arquivos do Discord expiram e podem parar de funcionar.
        </p>
      ) : null}
      {protectionWarning ? (
        <p className="text-muted flex items-start gap-2 text-xs">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Materiais por link externo não têm a proteção dos PDFs enviados (link temporário e marca
          d&apos;água).
        </p>
      ) : null}
    </div>
  );
}
