"use client";

import { FileText, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { setProfileFile } from "@/actions/profile";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";

type CurrentFile = { name: string; url: string | null } | null;

type ProfileFilesFormProps = {
  storageReady: boolean;
  photo: CurrentFile;
  cv: CurrentFile;
};

/** Foto do perfil e PDF do currículo (envio direto ao storage). */
export function ProfileFilesForm({ storageReady, photo, cv }: ProfileFilesFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(field: "photo" | "cv", mediaFileId: number | null): void {
    startTransition(async () => {
      const result = await setProfileFile(field, mediaFileId);
      setError(result.ok ? null : (result.message ?? "Falhou."));
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2" aria-busy={pending}>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Foto</h3>
        {photo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL do storage externo
          <img
            src={photo.url}
            alt="Foto atual do perfil"
            className="rounded-card border-border size-28 border object-cover"
          />
        ) : (
          <p className="text-muted text-sm">{photo ? photo.name : "Sem foto."}</p>
        )}
        <div className="flex flex-wrap items-start gap-2">
          <FileUpload
            kind="profile-photo"
            storageReady={storageReady}
            label="Enviar foto"
            onUploaded={(id) => update("photo", id)}
          />
          {photo ? (
            <Button variant="danger" size="sm" onClick={() => update("photo", null)}>
              <Trash2 className="size-4" aria-hidden /> Remover
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Currículo (botão &quot;Ver currículo&quot;)</h3>
        <p className="text-muted flex items-center gap-2 text-sm">
          <FileText className="size-4" aria-hidden />
          {cv ? cv.name : "Nenhum PDF enviado."}
        </p>
        <div className="flex flex-wrap items-start gap-2">
          <FileUpload
            kind="profile-cv"
            storageReady={storageReady}
            label="Enviar PDF"
            onUploaded={(id) => update("cv", id)}
          />
          {cv ? (
            <Button variant="danger" size="sm" onClick={() => update("cv", null)}>
              <Trash2 className="size-4" aria-hidden /> Remover
            </Button>
          ) : null}
        </div>
      </div>
      {error ? (
        <p role="alert" className="text-danger text-sm md:col-span-2">
          {error}
        </p>
      ) : null}
    </div>
  );
}
