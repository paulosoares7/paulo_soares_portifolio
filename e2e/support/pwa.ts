// Conferências do PWA comuns aos três apps (manifesto, service worker,
// página "Sem conexão" e nada de conteúdo guardado no aparelho).
import { expect, type Page } from "@playwright/test";

/**
 * Confere manifesto, ícones e o service worker de um app.
 * @param page Página do Playwright (com baseURL do app).
 * @param expectedName Nome completo esperado no manifesto.
 */
export async function expectInstallable(page: Page, expectedName: string): Promise<void> {
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const data = (await manifest.json()) as {
    name: string;
    display: string;
    start_url: string;
    icons: { src: string; purpose?: string }[];
  };
  expect(data.name).toBe(expectedName);
  expect(data.display).toBe("standalone");
  expect(data.start_url).toBe("/");
  expect(data.icons.map((i) => i.purpose)).toEqual(["any", "any", "maskable"]);
  for (const icon of data.icons) {
    const file = await page.request.get(icon.src);
    expect(file.ok(), icon.src).toBe(true);
    expect(file.headers()["content-type"]).toContain("image/png");
  }

  const sw = await page.request.get("/sw.js");
  expect(sw.ok()).toBe(true);
  expect(sw.headers()["content-type"]).toContain("javascript");
  const source = await sw.text();
  // O service worker só guarda a página "Sem conexão": nada de cache.put.
  expect(source).toContain("/offline.html");
  expect(source).not.toContain("cache.put");
}

/**
 * Abre uma página, espera o service worker ativar, derruba a rede e confere
 * que a próxima navegação mostra "Sem conexão" e que só essa página foi
 * guardada no aparelho.
 * @param page Página do Playwright.
 * @param startPath Página aberta com internet.
 * @param offlinePath Página aberta já sem internet.
 */
export async function expectOfflineFallback(
  page: Page,
  startPath: string,
  offlinePath: string,
): Promise<void> {
  await page.goto(startPath);
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  await page.context().setOffline(true);
  try {
    await page.goto(offlinePath);
    await expect(page.getByRole("heading", { name: "Sem conexão" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  } finally {
    await page.context().setOffline(false);
  }

  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const key of await caches.keys()) {
      const cache = await caches.open(key);
      for (const request of await cache.keys()) urls.push(new URL(request.url).pathname);
    }
    return urls;
  });
  expect(cached).toEqual(["/offline.html"]);
}
