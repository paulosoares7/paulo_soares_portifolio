// PWA do portfolio: instalável e com a página "Sem conexão".
import { test } from "@playwright/test";
import { expectInstallable, expectOfflineFallback } from "../support/pwa";

test("portfolio: manifesto, ícones e service worker", async ({ page }) => {
  await expectInstallable(page, "Portfólio acadêmico");
});

test("portfolio: sem internet mostra 'Sem conexão' e não guarda páginas", async ({ page }) => {
  await expectOfflineFallback(page, "/", "/sobre");
});
