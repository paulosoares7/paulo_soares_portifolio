// Regras dos links externos guardados no banco (materials.external_url,
// profile.photo_url, profile.cv_url). Funções puras, sem Prisma: usadas pelo
// admin (validar e converter ao salvar), pela plataforma (embutir o PDF do
// Drive) e pelo portfólio (foto e currículo). Ficam aqui porque os três apps
// já dependem deste pacote.

/** De onde vem o link (para avisos e para embutir). */
export type LinkSource =
  "google-drive" | "google-docs" | "onedrive" | "dropbox" | "discord" | "site";

/**
 * Diz se o texto é uma URL https válida.
 * @param value Texto digitado.
 * @returns true para https://...
 */
export function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Identifica o serviço do link pelo domínio.
 * @param value URL.
 * @returns Origem do link ("site" quando não é um serviço conhecido).
 */
export function linkSource(value: string): LinkSource {
  let host = "";
  try {
    host = new URL(value).hostname.toLowerCase();
  } catch {
    return "site";
  }
  if (host === "drive.google.com") return "google-drive";
  if (host === "docs.google.com") return "google-docs";
  if (host === "1drv.ms" || host.endsWith("onedrive.live.com") || host.endsWith("sharepoint.com"))
    return "onedrive";
  if (host === "dropbox.com" || host.endsWith(".dropbox.com")) return "dropbox";
  if (
    host === "cdn.discordapp.com" ||
    host === "media.discordapp.net" ||
    host.endsWith(".discordapp.com") ||
    host === "discord.com"
  )
    return "discord";
  return "site";
}

/** Rótulo do serviço para mostrar na tela. */
export const LINK_SOURCE_LABELS: Record<LinkSource, string> = {
  "google-drive": "Google Drive",
  "google-docs": "Google Docs",
  onedrive: "OneDrive",
  dropbox: "Dropbox",
  discord: "Discord",
  site: "Site",
};

/**
 * ID do arquivo num link do Google Drive (…/file/d/ID/…, open?id=ID, uc?id=ID).
 * @param value URL do Drive.
 * @returns ID ou null.
 */
export function driveFileId(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.hostname !== "drive.google.com") return null;
    const fromPath = url.pathname.match(/\/file\/d\/([\w-]{10,})/);
    if (fromPath?.[1]) return fromPath[1];
    const fromQuery = url.searchParams.get("id");
    return fromQuery && /^[\w-]{10,}$/.test(fromQuery) ? fromQuery : null;
  } catch {
    return null;
  }
}

/**
 * Normaliza o link antes de salvar: Drive vira o formato de visualização
 * (…/file/d/ID/view), que abre para quem tem a permissão de leitura.
 * @param value URL https.
 * @returns URL normalizada.
 */
export function normalizeExternalUrl(value: string): string {
  const trimmed = value.trim();
  const id = driveFileId(trimmed);
  return id ? `https://drive.google.com/file/d/${id}/view` : trimmed;
}

/**
 * Endereço para embutir o arquivo dentro da página (iframe), quando o serviço
 * permite: Drive (…/preview) e Google Docs/Slides/Planilhas (…/preview).
 * @param value URL salva.
 * @returns URL de incorporação ou null.
 */
export function embedUrl(value: string): string | null {
  const id = driveFileId(value);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  try {
    const url = new URL(value);
    const doc = url.pathname.match(/^\/(document|presentation|spreadsheets)\/d\/([\w-]{10,})/);
    if (url.hostname === "docs.google.com" && doc)
      return `https://docs.google.com/${doc[1]}/d/${doc[2]}/preview`;
  } catch {
    return null;
  }
  return null;
}

/**
 * Endereço de imagem para usar em <img> (foto do perfil por link). Drive não
 * serve a imagem no link de visualização; usa a miniatura grande.
 * @param value URL salva.
 * @returns URL que o navegador consegue exibir como imagem.
 */
export function imageUrl(value: string): string {
  const id = driveFileId(value);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1200` : value;
}
