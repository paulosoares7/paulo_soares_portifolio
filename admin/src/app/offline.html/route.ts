import { offlinePageResponse } from "@portfolio/ui/pwa";

// Arquivo fixo: gerado no build.
export const dynamic = "force-static";

/** Página "Sem conexão", mostrada pelo service worker quando a rede cai. */
export function GET(): Response {
  return offlinePageResponse("Painel do professor");
}
