// PWA da plataforma: instalável e sem guardar conteúdo no aparelho.
import { test } from "@playwright/test";
import { expectInstallable, expectOfflineFallback } from "../support/pwa";

test("plataforma: manifesto, ícones e service worker", async ({ page }) => {
  await expectInstallable(page, "Plataforma de aulas");
});

test("plataforma: sem internet mostra 'Sem conexão' e não guarda páginas", async ({ page }) => {
  await expectOfflineFallback(page, "/", "/aulas");
});
