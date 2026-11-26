"use client";

import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { setCourseCover } from "@/actions/catalog";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";

type CourseCoverFormProps = {
  courseId: number;
  storageReady: boolean;
  cover: { name: string; url: string | null } | null;
};

/** Imagem de capa da disciplina (opcional). */
export function CourseCoverForm({ courseId, storageReady, cover }: CourseCoverFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(mediaFileId: number | null): void {
    startTransition(async () => {
      const result = await setCourseCover(courseId, mediaFileId);
      setError(result.ok ? null : (result.message ?? "Falhou."));
    });
  }

  return (
    <div className="flex flex-col gap-3" aria-busy={pending}>
      {cover?.url ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL do storage externo
        <img
          src={cover.url}
          alt="Capa atual"
          className="rounded-card border-border h-28 w-48 border object-cover"
        />
      ) : (
        <p className="text-muted text-sm">
          {cover ? cover.name : "Sem capa (o cartão usa ícone e cor)."}
        </p>
      )}
      <div className="flex flex-wrap items-start gap-2">
        <FileUpload
          kind="course-cover"
          storageReady={storageReady}
          label="Enviar capa"
          onUploaded={(id) => update(id)}
        />
        {cover ? (
          <Button variant="danger" size="sm" onClick={() => update(null)}>
            <Trash2 className="size-4" aria-hidden /> Remover
          </Button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  );
}
