// Etapa 4: login (Google em destaque, visitante, validação ao vivo), menu do
// avatar, progresso da aula e a Minha área. O aluno de teste é recriado no
// global-setup com senha aleatória (e2e/.auth/student.json).
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const student = JSON.parse(
  readFileSync(path.resolve(__dirname, "../.auth/student.json"), "utf8"),
) as { email: string; password: string };

/** Entra com o aluno de teste pela tela de login. */
async function signIn(page: Page): Promise<void> {
  await page.goto("/entrar");
  await page.getByRole("textbox", { name: "E-mail" }).fill(student.email);
  await page.getByLabel("Senha").fill(student.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("button", { name: /Menu da conta de/ })).toBeVisible();
}

test("visitante vê Entrar, Google em destaque e entra como visitante", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/entrar/);
  await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible();
  await page.getByRole("link", { name: "Entrar como visitante" }).click();
  await expect(page).toHaveURL(/\/aulas$/);

  await page.goto("/cadastrar");
  await expect(page.getByRole("button", { name: "Continuar com Google" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar como visitante" })).toBeVisible();
});

test("formulário só libera com os campos válidos e mostra o erro no campo", async ({ page }) => {
  await page.goto("/cadastrar");
  const submit = page.getByRole("button", { name: "Criar conta" });
  await expect(submit).toBeDisabled();

  await page.getByLabel("Nome").fill("Maria Teste");
  await page.getByRole("textbox", { name: "E-mail" }).fill("maria@");
  await page.getByLabel("Senha").focus();
  await expect(page.getByText("Digite um e-mail válido.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "E-mail" })).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  await page.getByRole("textbox", { name: "E-mail" }).fill("maria@example.com");
  await page.getByLabel("Senha").fill("curta");
  await page.getByLabel("Nome").focus();
  await expect(page.getByText("A senha precisa ter pelo menos 8 caracteres.")).toBeVisible();
  await expect(submit).toBeDisabled();

  await page.getByLabel("Senha").fill("senha-bem-longa");
  await expect(page.getByText("Digite um e-mail válido.")).toHaveCount(0);
  await expect(submit).toBeEnabled();
});

test("menu do avatar, progresso da aula e Minha área", async ({ page }) => {
  await signIn(page);

  // Menu: abre, fecha clicando fora e com Esc.
  const avatar = page.getByRole("button", { name: /Menu da conta de/ });
  await avatar.click();
  const menu = page.getByRole("menu", { name: "Conta" });
  await expect(menu.getByRole("menuitem", { name: "Minha área" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Minhas disciplinas" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Assinatura" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Sair" })).toBeVisible();
  await page.mouse.click(10, 400);
  await expect(menu).toBeHidden();
  await avatar.click();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();

  // Minha área sem histórico.
  await avatar.click();
  await menu.getByRole("menuitem", { name: "Minhas disciplinas" }).click();
  await expect(page).toHaveURL(/\/minha-area#disciplinas/);
  await expect(page.getByText("Você ainda não começou nenhuma aula.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conquistas" })).toBeVisible();
  await expect(page.getByText("Sem cobrança (cortesia)")).toBeVisible();

  // Abre a primeira aula de Física I e marca como concluída.
  await page.goto("/disciplina/fisica-1");
  await page.locator('a[href^="/disciplina/fisica-1/"]').first().click();
  const done = page.getByRole("button", { name: "Marcar como concluída" });
  await expect(done).toBeVisible();
  const lessonTitle = (await page.getByRole("heading", { level: 1 }).textContent())?.trim() ?? "";
  await done.click();
  await expect(page.getByRole("button", { name: "Aula concluída" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  // As ações do servidor rodam em fila: liberado = visita e conclusão gravadas.
  await expect(page.getByRole("button", { name: "Aula concluída" })).toBeEnabled();

  // A Minha área mostra a aula vista e o progresso.
  await page.goto("/minha-area");
  await expect(page.getByRole("heading", { name: "Assistidas por último" })).toBeVisible();
  await expect(page.getByRole("link", { name: new RegExp(lessonTitle) }).first()).toBeVisible();
  const progress = page.getByRole("progressbar", { name: "Progresso em Física I" });
  await expect(progress).not.toHaveAttribute("aria-valuenow", "0");

  // Atividade grátis enviada logada entra em "Atividades recentes" com a nota.
  await page.goto("/atividades/1");
  await page.getByRole("radio", { name: /A velocidade/ }).check();
  await page.getByRole("textbox").first().fill("25");
  await page.getByRole("button", { name: "Enviar respostas" }).click();
  await expect(page.getByRole("button", { name: "Refazer" })).toBeVisible();
  await page.goto("/minha-area");
  const recent = page.getByRole("region", { name: "Atividades recentes" });
  await expect(recent.getByText("Atividade 1: MRU (grátis)")).toBeVisible();
  await expect(recent.getByText("100%", { exact: true })).toBeVisible();

  // Sair pelo menu volta a mostrar "Entrar".
  await avatar.click();
  await menu.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page.getByRole("banner").getByRole("link", { name: "Entrar" })).toBeVisible();
});
