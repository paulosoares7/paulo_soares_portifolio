// Bunny Stream: vídeos pagos (HLS). O navegador envia o arquivo direto ao
// Bunny pelo protocolo TUS; o servidor só cria o vídeo e assina o envio.
import { sha256 } from "@/lib/crypto";

const API = "https://video.bunnycdn.com";

/** Endereço TUS do Bunny para envio direto pelo navegador. */
export const BUNNY_TUS_ENDPOINT = `${API}/tusupload`;

/**
 * Diz se BUNNY_LIBRARY_ID e BUNNY_API_KEY estão preenchidas.
 * @returns true quando o envio ao Bunny pode ser usado.
 */
export function isBunnyConfigured(): boolean {
  return Boolean(process.env.BUNNY_LIBRARY_ID && process.env.BUNNY_API_KEY);
}

function credentials(): { libraryId: string; apiKey: string } {
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;
  if (!libraryId || !apiKey)
    throw new Error("Bunny não configurado: preencha BUNNY_* no .env.local.");
  return { libraryId, apiKey };
}

async function bunnyFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { apiKey } = credentials();
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      AccessKey: apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`O Bunny respondeu ${response.status}.`);
  return response;
}

/**
 * Cria o vídeo (vazio) na biblioteca do Bunny.
 * @param title Título interno.
 * @returns GUID do vídeo no Bunny.
 */
export async function createBunnyVideo(title: string): Promise<string> {
  const { libraryId } = credentials();
  const response = await bunnyFetch(`/library/${libraryId}/videos`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  const data = (await response.json()) as { guid?: string };
  if (!data.guid) throw new Error("O Bunny não devolveu o ID do vídeo.");
  return data.guid;
}

/**
 * Assinatura do envio TUS: SHA-256(library_id + api_key + expiração + video_id).
 * A chave da API nunca vai para o navegador; só a assinatura.
 * @param videoGuid GUID do vídeo no Bunny.
 * @param expiresAt Expiração em segundos Unix.
 * @returns Dados que o navegador envia como cabeçalhos.
 */
export function signBunnyUpload(
  videoGuid: string,
  expiresAt: number,
): { libraryId: string; signature: string } {
  const { libraryId, apiKey } = credentials();
  return { libraryId, signature: sha256(`${libraryId}${apiKey}${expiresAt}${videoGuid}`) };
}

// Códigos de status do Bunny Stream → status da tabela videos.
const STATUS_MAP: Record<number, "uploading" | "processing" | "ready" | "failed"> = {
  0: "uploading", // criado, aguardando envio
  1: "processing", // enviado
  2: "processing",
  3: "processing", // transcodificando
  4: "ready", // pronto
  5: "failed",
  6: "failed", // envio falhou
  7: "processing",
  8: "processing",
};

/**
 * Consulta status e duração do vídeo no Bunny.
 * @param videoGuid GUID do vídeo.
 * @returns Status convertido e duração em segundos.
 */
export async function getBunnyVideo(videoGuid: string): Promise<{
  status: "uploading" | "processing" | "ready" | "failed";
  durationSeconds: number | null;
}> {
  const { libraryId } = credentials();
  const response = await bunnyFetch(
    `/library/${libraryId}/videos/${encodeURIComponent(videoGuid)}`,
  );
  const data = (await response.json()) as { status?: number; length?: number };
  return {
    status: STATUS_MAP[data.status ?? -1] ?? "processing",
    durationSeconds: data.length && data.length > 0 ? Math.round(data.length) : null,
  };
}

/**
 * Apaga o vídeo no Bunny (ao remover o registro no painel).
 * @param videoGuid GUID do vídeo.
 */
export async function deleteBunnyVideo(videoGuid: string): Promise<void> {
  const { libraryId } = credentials();
  await bunnyFetch(`/library/${libraryId}/videos/${encodeURIComponent(videoGuid)}`, {
    method: "DELETE",
  });
}
