"use client";

import { FileText, Save, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { imageUrl } from "@portfolio/database/external-link";
import { setProfileFile, setProfileLink } from "@/actions/profile";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ExternalLinkField } from "@/components/ui/ExternalLinkField";
import { FileUpload } from "@/components/ui/FileUpload";
import { FormMessage } from "@/components/ui/FormMessage";
import { SourceTabs, type SourceMode } from "@/components/ui/SourceTabs";
import type { ActionState } from "@/types/action";

type CurrentFile = { name: string; url: string | null } | null;

type ProfileFilesFormProps = {
  storageReady: boolean;
  photo: CurrentFile;
  cv: CurrentFile;
  photoLink: string;
  cvLink: string;
};

/** Arquivo da pasta public do portfólio usado quando não há arquivo nem link. */
const PUBLIC_FALLBACK = {
  photo: "portfolio/public/perfil/foto.jpg (ou .png/.webp)",
  cv: "portfolio/public/perfil/curriculo.pdf",
};

type AssetProps = {
  field: "photo" | "cv";
  title: string;
  storageReady: boolean;
  file: CurrentFile;
  link: string;
};

/**
 * Foto ou currículo com duas formas de adicionar. Prioridade no portfólio:
 * arquivo enviado → link externo → arquivo da pasta public.
 */
function ProfileAsset({ field, title, storageReady, file, link }: AssetProps) {
  const [mode, setMode] = useState<SourceMode>(
    file ? "file" : link ? "link" : storageReady ? "file" : "link",
  );
  const [draft, setDraft] = useState(link);
  const [state, setState] = useState<ActionState>({ ok: false });
  const [pending, startTransition] = useTransition();

  const run = (action: () => Promise<ActionState>) =>
    startTransition(async () => setState(await action()));
  const inUse = file ? "arquivo enviado" : link ? "link externo" : "pasta public (se existir)";

  return (
    <div className="flex flex-col gap-3" aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge tone={file || link ? "accent" : "neutral"}>em uso: {inUse}</Badge>
      </div>
      {field === "photo" && (file?.url || link) ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL externa (storage ou link)
        <img
          src={file?.url ?? imageUrl(link)}
          alt="Foto atual do perfil"
          className="rounded-card border-border size-28 border object-cover"
        />
      ) : null}

      <SourceTabs mode={mode} onChange={setMode} label={`Forma de adicionar: ${title}`} />

      {mode === "file" ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted flex items-center gap-2 text-sm">
            <FileText className="size-4" aria-hidden />
            {file ? file.name : "Nenhum arquivo enviado."}
          </p>
          <div className="flex flex-wrap items-start gap-2">
            <FileUpload
              kind={field === "photo" ? "profile-photo" : "profile-cv"}
              storageReady={storageReady}
              label={field === "photo" ? "Enviar foto" : "Enviar PDF"}
              onUploaded={(id) => run(() => setProfileFile(field, id))}
            />
            {file ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => run(() => setProfileFile(field, null))}
              >
                <Trash2 className="size-4" aria-hidden /> Remover arquivo
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <ExternalLinkField
            id={`profile-${field}-url`}
            name={`${field}Url`}
            defaultValue={link}
            onValueChange={setDraft}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => setProfileLink(field, draft))}
            >
              <Save className="size-4" aria-hidden /> Salvar link
            </Button>
            {link ? (
              <Button
                variant="danger"
                size="sm"
                disabled={pending}
                onClick={() => run(() => setProfileLink(field, ""))}
              >
                <Trash2 className="size-4" aria-hidden /> Remover link
              </Button>
            ) : null}
          </div>
          {file ? (
            <p className="text-muted text-xs">
              Há um arquivo enviado: ele tem prioridade sobre o link.
            </p>
          ) : null}
        </div>
      )}
      <p className="text-muted text-xs">
        Sem arquivo nem link, o portfólio usa {PUBLIC_FALLBACK[field]}.
      </p>
      <FormMessage state={state} />
    </div>
  );
}

/** Foto do perfil e currículo: arquivo enviado ao storage ou link externo. */
export function ProfileFilesForm({
  storageReady,
  photo,
  cv,
  photoLink,
  cvLink,
}: ProfileFilesFormProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <ProfileAsset
        field="photo"
        title="Foto"
        storageReady={storageReady}
        file={photo}
        link={photoLink}
      />
      <ProfileAsset
        field="cv"
        title='Currículo (botão "Ver currículo")'
        storageReady={storageReady}
        file={cv}
        link={cvLink}
      />
    </div>
  );
}
