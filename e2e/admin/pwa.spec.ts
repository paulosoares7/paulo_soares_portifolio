// PWA do admin: os arquivos do app abrem sem login (o "Instalar app" aparece
// já na tela de login) e nada do painel fica guardado no aparelho.
import { test } from "@playwright/test";
import { expectInstallable, expectOfflineFallback } from "../support/pwa";

// Sem a sessão do admin: confere o que o navegador vê antes do login.
test.use({ storageState: { cookies: [], origins: [] } });

test("admin: manifesto, ícones e service worker abertos sem login", async ({ page }) => {
  await expectInstallable(page, "Painel do professor");
});

test("admin: sem internet mostra 'Sem conexão' e não guarda páginas", async ({ page }) => {
  await expectOfflineFallback(page, "/login", "/esqueci-a-senha");
});
