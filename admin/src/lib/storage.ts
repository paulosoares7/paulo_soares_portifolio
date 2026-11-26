// Storage S3 compatível (Cloudflare R2, Backblaze B2, AWS S3...) para PDFs e imagens.
// O navegador envia o arquivo direto ao bucket com uma URL assinada; assim o
// arquivo não passa pela função da Vercel (limite de 4,5 MB por requisição).
import { randomUUID } from "node:crypto";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Diz se as variáveis STORAGE_* estão preenchidas.
 * @returns true quando o envio de arquivos pode ser usado.
 */
export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.STORAGE_ENDPOINT &&
    process.env.STORAGE_BUCKET &&
    process.env.STORAGE_ACCESS_KEY &&
    process.env.STORAGE_SECRET_KEY,
  );
}

let cachedClient: S3Client | null = null;

function storageClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error("Storage não configurado: preencha STORAGE_* no .env.local.");
  }
  cachedClient ??= new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION || "auto",
    // R2 e B2 exigem endereçamento por caminho (endpoint/bucket/chave).
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY ?? "",
      secretAccessKey: process.env.STORAGE_SECRET_KEY ?? "",
    },
  });
  return cachedClient;
}

const bucket = (): string => process.env.STORAGE_BUCKET ?? "";

/**
 * Monta a chave do arquivo no bucket, sem nomes previsíveis.
 * @param folder Pasta (ex.: materials).
 * @param originalName Nome original, usado só para a extensão.
 * @returns Chave como materials/2026/uuid.pdf.
 */
export function buildStorageKey(folder: string, originalName: string): string {
  const extension = originalName.match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase() ?? "bin";
  return `${folder}/${new Date().getUTCFullYear()}/${randomUUID()}.${extension}`;
}

/**
 * URL assinada para o navegador enviar o arquivo com PUT (válida por 10 min).
 * @param key Chave no bucket.
 * @param contentType Tipo MIME declarado.
 * @returns URL de envio.
 */
export async function createUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType });
  return getSignedUrl(storageClient(), command, { expiresIn: 600 });
}

/**
 * Confere se o arquivo chegou ao bucket.
 * @param key Chave no bucket.
 * @returns Tamanho e tipo, ou null se não existir.
 */
export async function headObject(
  key: string,
): Promise<{ size: number; contentType: string | null } | null> {
  try {
    const result = await storageClient().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key }),
    );
    return { size: result.ContentLength ?? 0, contentType: result.ContentType ?? null };
  } catch {
    return null;
  }
}

/**
 * URL assinada de leitura (curta duração), para pré-visualizar no painel.
 * @param key Chave no bucket.
 * @param seconds Validade em segundos (padrão 5 min).
 * @returns URL temporária.
 */
export async function createReadUrl(key: string, seconds = 300): Promise<string> {
  return getSignedUrl(storageClient(), new GetObjectCommand({ Bucket: bucket(), Key: key }), {
    expiresIn: seconds,
  });
}

/**
 * URL pública fixa de um arquivo público (quando STORAGE_PUBLIC_URL existe).
 * @param key Chave no bucket.
 * @returns URL ou null.
 */
export function publicUrlFor(key: string): string | null {
  const base = process.env.STORAGE_PUBLIC_URL?.replace(/\/+$/, "");
  return base ? `${base}/${key}` : null;
}
