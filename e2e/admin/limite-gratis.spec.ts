// RN10 ajustável: o limite de aulas e atividades grátis é definido no
// cadastro da disciplina (vazio = sem limite).
import { expect, test, type Page } from "@playwright/test";

/** Abre a edição da Física I (disciplina 1 do seed) e devolve o formulário dela. */
async function openPhysics(page: Page) {
  await page.goto("/disciplinas/1");
  const form = page.locator("form", { has: page.getByLabel("Máximo de aulas grátis") });
  await expect(form).toBeVisible();
  return form;
}

/** Grava os dois limites e espera a confirmação do formulário da disciplina. */
async function saveLimits(page: Page, lessons: string, activities: string) {
  const form = await openPhysics(page);
  await form.getByLabel("Máximo de aulas grátis").fill(lessons);
  await form.getByLabel("Máximo de atividades grátis").fill(activities);
  await form.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(form.getByText("Disciplina salva.")).toBeVisible();
}

test("limite de aulas grátis ajustável por disciplina", async ({ page }) => {
  const form = await openPhysics(page);
  // Padrão das disciplinas existentes: 2 aulas e 1 atividade.
  await expect(form.getByLabel("Máximo de aulas grátis")).toHaveValue("2");
  await expect(form.getByLabel("Máximo de atividades grátis")).toHaveValue("1");

  try {
    // Vazio = sem limite.
    await saveLimits(page, "", "3");
    const reloaded = await openPhysics(page);
    await expect(page.getByText(/aulas grátis \(sem limite\)/)).toBeVisible();
    await expect(reloaded.getByLabel("Máximo de aulas grátis")).toHaveValue("");
    await expect(reloaded.getByLabel("Máximo de atividades grátis")).toHaveValue("3");

    // Número negativo é recusado.
    await reloaded.getByLabel("Máximo de aulas grátis").fill("-1");
    await reloaded.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(reloaded.getByText(/Mínimo 0/)).toBeVisible();
  } finally {
    // Volta ao padrão para não afetar os outros testes.
    await saveLimits(page, "2", "1");
  }
});
