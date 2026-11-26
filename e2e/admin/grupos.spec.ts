// Categoria → Grupo → Disciplina no painel (Etapa 2).
import { expect, test } from "@playwright/test";

test("categorias mostram os grupos de cada uma", async ({ page }) => {
  await page.goto("/categorias");
  await expect(page.getByRole("heading", { name: "Categorias e grupos" })).toBeVisible();
  const superior = page.locator("section, div").filter({
    has: page.getByText("Grupos de Ensino Superior", { exact: true }),
  });
  await expect(superior.getByText("Física", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("/aulas/ensino-superior/fisica", { exact: false })).toBeVisible();
});

test("cria e remove um grupo", async ({ page }) => {
  const name = `Grupo teste ${Date.now()}`;
  await page.goto("/categorias");
  await page.getByRole("button", { name: "Novo grupo" }).nth(1).click(); // Ensino Médio
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome").fill(name);
  await dialog.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText(name)).toBeVisible();

  page.once("dialog", (confirm) => confirm.accept());
  const row = page.locator("li").filter({ hasText: name });
  await row.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText(name)).toHaveCount(0);
});

test("disciplinas aparecem dentro do grupo", async ({ page }) => {
  await page.goto("/disciplinas");
  const group = page.getByRole("region", { name: "Ensino Superior › Física" });
  await expect(group.getByText("Física I")).toBeVisible();
});

test("formulário da disciplina escolhe o grupo", async ({ page }) => {
  await page.goto("/disciplinas/nova");
  const select = page.getByLabel("Categoria › Grupo");
  await expect(select.locator("option", { hasText: "Vestibulares › PSC (UFAM)" })).toHaveCount(1);
});
