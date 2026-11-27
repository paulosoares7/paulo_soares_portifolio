"use client";

import { Upload } from "lucide-react";
import { useId, useState } from "react";
import { registerUpload } from "@/actions/media";
import { UPLOAD_RULES, type UploadKind } from "@/lib/upload-kinds";

type FileUploadProps = {
  kind: UploadKind;
  /** Vem do servidor: false quando STORAGE_* não está configurado. */
  storageReady: boolean;
  label: string;
  /** Chamado com o ID em media_files depois do envio. */
  onUploaded: (mediaFileId: number, originalName: string) => void | Promise<void>;
};

/**
 * Envia o arquivo direto ao storage (PUT na URL assinada) com barra de
 * progresso e depois registra em media_files.
 */
export function FileUpload({ kind, storageReady, label, onUploaded }: FileUploadProps) {
  const inputId = useId();
  const rule = UPLOAD_RULES[kind];
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!storageReady) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled
          className="rounded-btn border-border text-muted inline-flex w-fit cursor-not-allowed items-center gap-2 border px-3 py-2 text-sm opacity-60"
        >
          <Upload className="size-4" aria-hidden />
          {label}
        </button>
        <p className="rounded-btn border-warning/50 text-warning border border-dashed px-3 py-2 text-xs">
          Configure o armazenamento para enviar arquivos (STORAGE_* no .env.local do painel).
        </p>
      </div>
    );
  }

  async function handleFile(file: File): Promise<void> {
    setError(null);
    if (!rule.accept.includes(file.type)) return setError(`Tipo não aceito. ${rule.label}.`);
    if (file.size > rule.maxBytes) return setError(`Arquivo grande demais. ${rule.label}.`);

    setProgress(0);
    try {
      const response = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      const data = (await response.json()) as {
        uploadUrl?: string;
        storageKey?: string;
        error?: string;
      };
      if (!response.ok || !data.uploadUrl || !data.storageKey)
        throw new Error(data.error ?? "Falha ao preparar o envio.");

      // XHR em vez de fetch: só ele informa o progresso do envio.
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", data.uploadUrl as string);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
        };
        xhr.onload = () =>
          xhr.status < 300 ? resolve() : reject(new Error(`Storage respondeu ${xhr.status}.`));
        xhr.onerror = () => reject(new Error("Falha de rede (confira o CORS do bucket)."));
        xhr.send(file);
      });

      const result = await registerUpload({
        kind,
        storageKey: data.storageKey,
        originalName: file.name,
      });
      if (!result.ok || !result.mediaFileId)
        throw new Error(result.message ?? "Falha ao registrar.");
      await onUploaded(result.mediaFileId, file.name);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Falha no envio.");
    } finally {
      setProgress(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="rounded-btn border-accent text-accent hover:bg-accent/10 inline-flex w-fit cursor-pointer items-center gap-2 border px-3 py-2 text-sm"
      >
        <Upload className="size-4" aria-hidden />
        {label}
      </label>
      <input
        id={inputId}
        type="file"
        accept={rule.accept.join(",")}
        className="sr-only"
        disabled={progress !== null}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <p className="text-muted text-xs">{rule.label}</p>
      {progress !== null ? (
        <div
          className="bg-surface-2 h-2 w-full max-w-xs overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="bg-accent h-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
