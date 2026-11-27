import { serviceWorkerResponse } from "@portfolio/ui/pwa";

// Arquivo fixo: gerado no build.
export const dynamic = "force-static";

/** Service worker do PWA (só guarda a página "Sem conexão"). */
export function GET(): Response {
  return serviceWorkerResponse();
}
