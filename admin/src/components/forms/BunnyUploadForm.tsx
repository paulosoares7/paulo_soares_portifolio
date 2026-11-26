"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { finishVideoUpload } from "@/actions/videos";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

type UploadTicket = {
  id: number;
  guid: string;
  libraryId: string;
  signature: string;
  expiresAt: number;
  endpoint: string;
  error?: string;
};

/**
 * Envio de vídeo pago direto ao Bunny (TUS, com retomada e barra de progresso).
 * O arquivo não passa pelo servidor do painel: ele só cria o vídeo e assina.
 */
export function BunnyUploadForm({ bunnyReady }: { bunnyReady: boolean }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  if (!bunnyReady) {
    return (
      <p className="rounded-btn border-warning/50 text-warning border border-dashed px-3 py-2 text-sm">
        Envio ao Bunny desativado: preencha BUNNY_LIBRARY_ID e BUNNY_API_KEY no .env.local. Enquanto
        isso, cadastre vídeos por link (YouTube, Vimeo ou MP4).
      </p>
    );
  }

  async function start(): Promise<void> {
    if (!file || !title.trim()) {
      setMessage({ ok: false, text: "Informe o título e escolha o arquivo." });
      return;
    }
    if (!file.type.startsWith("video/")) {
      setMessage({ ok: false, text: "Escolha um arquivo de vídeo." });
      return;
    }
    setMessage(null);
    setProgress(0);

    const response = await fetch("/api/videos/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    const ticket = (await response.json()) as UploadTicket;
    if (!response.ok) {
      setProgress(null);
      setMessage({ ok: false, text: ticket.error ?? "Falha ao preparar o envio." });
      return;
    }

    const upload = new Upload(file, {
      endpoint: ticket.endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        AuthorizationSignature: ticket.signature,
        AuthorizationExpire: String(ticket.expiresAt),
        VideoId: ticket.guid,
        LibraryId: ticket.libraryId,
      },
      metadata: { filetype: file.type, title: title.trim() },
      onProgress: (sent, total) => setProgress(Math.round((sent / total) * 100)),
      onError: async (error) => {
        await finishVideoUpload(ticket.id, false);
        setProgress(null);
        setMessage({ ok: false, text: `Envio falhou: ${error.message}` });
      },
      onSuccess: async () => {
        await finishVideoUpload(ticket.id, true);
        setProgress(null);
        setTitle("");
        setFile(null);
        if (fileInput.current) fileInput.current.value = "";
        setMessage({
          ok: true,
          text: "Vídeo enviado. O Bunny está processando; atualize o status em alguns minutos.",
        });
      },
    });
    upload.start();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Título (interno)" htmlFor="bunny-title">
          <Input
            id="bunny-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
          />
        </Field>
        <Field label="Arquivo de vídeo" htmlFor="bunny-file">
          <input
            ref={fileInput}
            id="bunny-file"
            type="file"
            accept="video/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="text-muted file:rounded-btn file:border-accent file:text-accent text-sm file:mr-3 file:border file:bg-transparent file:px-3 file:py-2"
          />
        </Field>
      </div>
      {progress !== null ? (
        <div className="flex items-center gap-3">
          <div
            className="bg-surface-2 h-2 flex-1 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="bg-accent h-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-muted w-12 text-right text-sm">{progress}%</span>
        </div>
      ) : null}
      {message ? (
        <p
          role={message.ok ? "status" : "alert"}
          className={`text-sm ${message.ok ? "text-success" : "text-danger"}`}
        >
          {message.text}
        </p>
      ) : null}
      <div>
        <Button onClick={() => void start()} disabled={progress !== null}>
          <UploadCloud className="size-4" aria-hidden />{" "}
          {progress !== null ? "Enviando..." : "Enviar ao Bunny"}
        </Button>
      </div>
    </div>
  );
}
