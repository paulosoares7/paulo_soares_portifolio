// Catálogo por Categoria → Grupo → Disciplina e o caminho (Etapa 2).
import { expect, test } from "@playwright/test";

test("catálogo mostra o grupo com as disciplinas", async ({ page }) => {
  await page.goto("/aulas");
  await expect(page.getByRole("heading", { name: "Física", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Física I/ }).first()).toBeVisible();
});

test("página do grupo tem caminho e cartões", async ({ page }) => {
  await page.goto("/aulas/ensino-superior/fisica");
  const crumbs = page.getByRole("navigation", { name: "Caminho" });
  await expect(crumbs).toContainText("Aulas");
  await expect(crumbs).toContainText("Ensino Superior");
  await expect(crumbs.getByText("Física", { exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: /Física I/ }).first()).toBeVisible();
});

// Com o loading.tsx a resposta já começou quando o notFound() roda, então o
// código HTTP fica 200; o Next mostra a página 404 e marca noindex.
test("grupo inexistente mostra a página 404", async ({ page }) => {
  await page.goto("/aulas/ensino-superior/nao-existe");
  await expect(page.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
  // O Next pode repetir a meta tag ao hidratar; basta existir.
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});

test("disciplina mostra Categoria › Grupo › Disciplina", async ({ page }) => {
  await page.goto("/disciplina/fisica-1");
  const crumbs = page.getByRole("navigation", { name: "Caminho" });
  await expect(crumbs).toContainText(/Ensino Superior.*Física.*Física I/);
  await crumbs.getByRole("link", { name: "Física", exact: true }).click();
  await expect(page).toHaveURL(/\/aulas\/ensino-superior\/fisica$/);
});
