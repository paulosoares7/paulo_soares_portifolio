// Etapa 4b: painel do aluno depois do login, saudação na página inicial e o
// convite para assinar na última aula grátis da disciplina. Física I (seed):
// as aulas grátis são "o-que-e-movimento" e "velocidade-constante" (a última).
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

const student = JSON.parse(
  readFileSync(path.resolve(__dirname, "../.auth/student.json"), "utf8"),
) as { email: string; password: string };

const FIRST_FREE = "/disciplina/fisica-1/cinematica/o-que-e-movimento";
const LAST_FREE = "/disciplina/fisica-1/cinematica/velocidade-constante";

test("visitante recebe o convite ao abrir a última aula grátis", async ({ page }) => {
  // Primeira aula grátis: sem convite.
  await page.goto(FIRST_FREE);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Última aula grátis: o modal abre na hora, com o preço do plano.
  await page.goto(LAST_FREE);
  const invite = page.getByRole("dialog", { name: /última aula grátis de Física I/ });
  await expect(invite).toBeVisible();
  await expect(invite.getByText(/R\$/)).toBeVisible();
  await expect(invite.getByRole("link", { name: "Quero assinar" })).toHaveAttribute(
    "href",
    "/assinar",
  );

  // Fechar continua na aula; o cartão fixo fica abaixo do vídeo.
  await invite.getByRole("button", { name: "Continuar assistindo" }).click();
  await expect(invite).toBeHidden();
  await expect(page.getByText("Aulas com cadeado são para assinantes")).toBeVisible();

  // Ao recarregar, o modal não volta na mesma visita.
  await page.reload();
  await expect(page.getByText("Aulas com cadeado são para assinantes")).toBeVisible();
  await expect(page.getByRole("dialog", { name: /última aula grátis/ })).toBeHidden();
});

test("login pelo topo leva ao painel e a página inicial cumprimenta", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  await page.getByRole("textbox", { name: "E-mail" }).fill(student.email);
  await page.getByLabel("Senha").fill(student.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();

  // Painel: a tela de início do aluno.
  await expect(page).toHaveURL(/\/minha-area$/);
  const stats = page.getByRole("list", { name: "Seu desempenho" });
  await expect(stats.getByText("aula(s) concluída(s)")).toBeVisible();
  await expect(stats.getByText("dias de estudo na semana")).toBeVisible();
  await expect(page.getByRole("list", { name: "Dias de estudo nos últimos 7 dias" })).toBeVisible();

  // Página inicial para quem está logado.
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Olá, Aluno!/ })).toBeVisible();
  await page.getByRole("link", { name: "Ir para o meu painel" }).click();
  await expect(page).toHaveURL(/\/minha-area$/);

  // Assinante de Física I (cortesia do teste): sem convite na última aula grátis.
  await page.goto(LAST_FREE);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Aulas com cadeado são para assinantes")).toHaveCount(0);
});
