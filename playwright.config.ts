// Testes de ponta a ponta (Playwright) do admin, da plataforma e do portfolio.
// Rodam contra os apps em desenvolvimento e o MySQL local com o seed.
//   npm run e2e            (liga os apps que não estiverem no ar)
//   npm run e2e -- --ui    (modo visual)
import { defineConfig, devices } from "@playwright/test";

const ADMIN_URL = "http://localhost:3001";
const PLATAFORMA_URL = "http://localhost:3002";
const PORTFOLIO_URL = "http://localhost:3000";

// No Windows usa o Edge que já vem instalado (evita baixar o Chromium).
// Em outros sistemas: npx playwright install chromium.
const browser = process.platform === "win32" ? { channel: "msedge" } : {};

export default defineConfig({
  testDir: "./e2e",
  // Os testes mexem no mesmo banco: um de cada vez evita que um atrapalhe o outro.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  // O primeiro acesso a cada página compila no "next dev" e pode demorar.
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  globalSetup: "./e2e/global-setup.ts",
  use: {
    locale: "pt-BR",
    timezoneId: "America/Manaus",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "admin",
      testMatch: "admin/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        ...browser,
        baseURL: ADMIN_URL,
        // Sessão criada no global-setup (sem senha no repositório).
        storageState: "e2e/.auth/admin.json",
      },
    },
    {
      name: "plataforma",
      testMatch: "plataforma/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"], ...browser, baseURL: PLATAFORMA_URL },
    },
    {
      name: "portfolio",
      testMatch: "portfolio/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"], ...browser, baseURL: PORTFOLIO_URL },
    },
  ],
  webServer: [
    {
      command: "npm run admin:dev",
      url: `${ADMIN_URL}/login`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: "npm run plataforma:dev",
      url: PLATAFORMA_URL,
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: "npm run portfolio:dev",
      url: PORTFOLIO_URL,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
