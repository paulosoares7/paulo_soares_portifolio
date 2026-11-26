// Converte o registro de `videos` na fonte que o player usa.
// Só é chamado DEPOIS de lib/access.ts liberar a aula.

/** Fonte pronta para o player. */
export type PlayerSource =
  | { kind: "youtube"; embedUrl: string }
  | { kind: "vimeo"; embedUrl: string }
  | { kind: "mp4"; url: string }
  | { kind: "unavailable"; reason: string };

/**
 * Extrai o ID de um link do YouTube (watch, youtu.be, embed ou shorts).
 * @param url Link salvo no painel.
 * @returns ID do vídeo ou null.
 */
export function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i,
  );
  return match?.[1] ?? null;
}

/**
 * Extrai o ID numérico de um link do Vimeo.
 * @param url Link salvo no painel.
 * @returns ID ou null.
 */
export function vimeoId(url: string): string | null {
  return url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)?.[1] ?? null;
}

/**
 * Monta a fonte do player a partir do vídeo da aula.
 * @param video Origem, provedor e link do vídeo.
 * @returns Fonte para o componente VideoPlayer.
 */
export function toPlayerSource(video: {
  provider: string;
  externalUrl: string | null;
}): PlayerSource {
  const url = video.externalUrl ?? "";
  if (video.provider === "youtube") {
    const id = youtubeId(url);
    // youtube-nocookie: não grava cookies de rastreamento antes do play.
    return id
      ? {
          kind: "youtube",
          embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`,
        }
      : { kind: "unavailable", reason: "Link do YouTube inválido." };
  }
  if (video.provider === "vimeo") {
    const id = vimeoId(url);
    return id
      ? { kind: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}?dnt=1` }
      : { kind: "unavailable", reason: "Link do Vimeo inválido." };
  }
  if (video.provider === "mp4" && /^https:\/\//i.test(url)) return { kind: "mp4", url };
  // Bunny/Panda exigem URL assinada de 2 h + marca d'água (fase 4, /api/player-token).
  return { kind: "unavailable", reason: "Player de vídeo hospedado disponível em breve." };
}
