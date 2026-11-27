// PWA comum aos três apps (admin, portfolio e plataforma): manifesto,
// service worker e página "Sem conexão". Cada app só chama estas funções em
// app/manifest.ts, app/sw.js/route.ts e app/offline.html/route.ts.
//
// Regra de segurança: o service worker NÃO guarda nada além da página
// "Sem conexão". Páginas, PDFs, vídeos, imagens e respostas da API sempre vêm
// da rede, então nenhum conteúdo pago ou dado do aluno fica no aparelho.
import type { MetadataRoute } from "next";
import { THEME_COLOR_DARK } from "./theme-color";

/** Endereço da página "Sem conexão" (guardada na instalação do service worker). */
export const OFFLINE_PATH = "/offline.html";

/** Nome e descrição do app instalado. */
export type PwaInfo = {
  /** Nome completo (tela de instalação). */
  name: string;
  /** Nome curto (embaixo do ícone na tela inicial). */
  shortName: string;
  description: string;
};

/**
 * Manifesto do app (vira /manifest.webmanifest com o <link> automático).
 * @param info Nome e descrição.
 * @returns Manifesto com ícones, cores e modo "standalone".
 */
export function buildManifest(info: PwaInfo): MetadataRoute.Manifest {
  return {
    name: info.name,
    short_name: info.shortName,
    description: info.description,
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: THEME_COLOR_DARK,
    theme_color: THEME_COLOR_DARK,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

// Mude a versão quando a página "Sem conexão" mudar: o service worker novo
// apaga o cache antigo.
const SERVICE_WORKER = `// Service worker (gerado por @portfolio/ui/pwa). Só guarda a página "Sem conexão".
const CACHE = "offline-v1";
const OFFLINE_URL = "${OFFLINE_PATH}";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

// Só a navegação entre páginas passa por aqui, e sempre pela rede. Sem rede,
// mostra a página "Sem conexão". Nada é guardado (PDF, vídeo, API, imagens).
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});
`;

/**
 * Resposta de /sw.js. Sem cache no navegador, para a versão nova chegar logo.
 * @returns Script do service worker.
 */
export function serviceWorkerResponse(): Response {
  return new Response(SERVICE_WORKER, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

/**
 * Resposta de /offline.html: página simples, sem depender de CSS ou fonte de
 * fora (ela precisa abrir sem internet). As cores repetem os tokens do tema
 * escuro (tokens.css) porque a página não carrega o Tailwind.
 * @param appName Nome mostrado no título.
 * @returns Página HTML.
 */
export function offlinePageResponse(appName: string): Response {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${THEME_COLOR_DARK}">
<title>Sem conexão · ${appName}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px;
    background: #0b1622; color: #f1f5f9; font-family: system-ui, sans-serif; text-align: center; }
  main { max-width: 360px; }
  h1 { font-size: 1.25rem; margin: 16px 0 8px; }
  p { color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
  button { background: #0ea5e9; color: #0b1622; border: 0; border-radius: 8px;
    padding: 10px 20px; font: inherit; font-weight: 600; cursor: pointer; }
  button:hover { background: #0284c7; }
</style>
</head>
<body>
<main>
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M5 12.86a10 10 0 0 1 5.17-2.69"/><path d="M19 12.86a10 10 0 0 0-2-1.43"/><path d="M2 8.82a15 15 0 0 1 4.17-2.65"/><path d="M10.66 5c4.01-.36 8.14.9 11.34 3.76"/><path d="m2 2 20 20"/></svg>
  <h1>Sem conexão</h1>
  <p>Não foi possível abrir esta página. Confira a internet e tente de novo.</p>
  <button type="button" onclick="location.reload()">Tentar de novo</button>
</main>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
