// Etapa 3: adicionar aluno com cortesia, editar a assinatura pelo lápis,
// desligar a cortesia e excluir o aluno (sem histórico = apagado de vez).
import { expect, test } from "@playwright/test";

test("ciclo do aluno: adicionar, editar vagas, desligar cortesia e excluir", async ({ page }) => {
  const stamp = Date.now();
  const name = `Aluno Teste ${stamp}`;
  const email = `aluno.teste.${stamp}@example.com`;

  // 1. Adicionar aluno com cortesia de 10 dias (sem convite).
  await page.goto("/alunos");
  await page.getByRole("button", { name: "Adicionar aluno" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome", { exact: true }).fill(name);
  await dialog.getByRole("textbox", { name: "E-mail" }).fill(email);
  await dialog.getByRole("checkbox", { name: /Enviar convite/ }).uncheck();
  const courtesySwitch = dialog.getByRole("switch", { name: "Dar cortesia" });
  await expect(courtesySwitch).toHaveAttribute("aria-checked", "false");
  await courtesySwitch.click();
  await expect(courtesySwitch).toHaveAttribute("aria-checked", "true");
  await dialog.getByLabel("Dias de cortesia").fill("10");
  await dialog.getByRole("checkbox", { name: /^Física I ·/ }).check();
  await expect(dialog.getByText("1 de 3 vaga(s)")).toBeVisible();
  await dialog.getByRole("button", { name: "Adicionar aluno" }).click();
  await expect(dialog.getByText(/Aluno cadastrado/)).toBeVisible();
  await page.keyboard.press("Escape");

  // 2. Na página do aluno a cortesia aparece ligada.
  await page.reload();
  await page.getByRole("link", { name }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await expect(page.getByRole("switch", { name: /Cortesia ligada/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  const studentUrl = page.url();

  // 3. Lápis em Assinaturas: exceção de 5 vagas para este aluno.
  await page.goto("/assinaturas");
  const row = page.getByRole("row").filter({ hasText: name });
  await row.getByRole("button", { name: "Editar assinatura" }).click();
  const edit = page.getByRole("dialog");
  await edit.getByLabel("Vagas deste aluno").fill("5");
  await expect(edit.getByText("1 de 5 vaga(s)")).toBeVisible();
  await edit.getByRole("button", { name: "Salvar" }).click();
  await expect(row.getByText("Exceção: 5 vaga(s) para este aluno")).toBeVisible();
  await expect(row.getByText("5. livre")).toBeVisible();

  // 4. Desligar a cortesia pelo botão (confirmação do navegador).
  await page.goto(studentUrl);
  page.once("dialog", (confirm) => confirm.accept());
  await page.getByRole("switch", { name: /Cortesia ligada/ }).click();
  await expect(page.getByText("Cortesia desligada.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("switch", { name: "Cortesia" })).toHaveAttribute(
    "aria-checked",
    "false",
  );

  // 5. Excluir: e-mail errado é recusado; o certo apaga e volta para a lista.
  await expect(page.getByText("apagado de vez")).toBeVisible();
  const confirmField = page.getByLabel(/Para confirmar, digite o e-mail/);
  await confirmField.fill("outro@example.com");
  await page.getByRole("button", { name: "Excluir aluno" }).click();
  await expect(page.getByText("O e-mail digitado não confere.")).toBeVisible();
  await confirmField.fill(email);
  await page.getByRole("button", { name: "Excluir aluno" }).click();
  await expect(page).toHaveURL(/\/alunos$/);
  await expect(page.getByRole("link", { name })).toHaveCount(0);
});

test("plano aceita de 1 a 10 vagas", async ({ page }) => {
  await page.goto("/assinaturas");
  await page.getByRole("button", { name: "Editar", exact: true }).first().click();
  const options = page.getByRole("dialog").getByLabel("Vagas de disciplina").locator("option");
  await expect(options).toHaveCount(10);
});
