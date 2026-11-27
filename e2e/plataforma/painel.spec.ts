// Etapa 4b: o Início é o painel do aluno logado (completo para quem assina,
// simples com a chamada para assinar para quem não assina) e o convite para
// assinar na última aula grátis. Física I (seed): as aulas grátis são
// "o-que-e-movimento" e "velocidade-constante" (a última).
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const accounts = JSON.parse(
  readFileSync(path.resolve(__dirname, "../.auth/student.json"), "utf8"),
) as { email: string; password: string; freeEmail: string; freePassword: string };

const FIRST_FREE = "/disciplina/fisica-1/cinematica/o-que-e-movimento";
const LAST_FREE = "/disciplina/fisica-1/cinematica/velocidade-constante";

/**
 * Entra pelo botão "Entrar" do topo da página inicial.
 * @param page Página do teste.
 * @param email E-mail.
 * @param password Senha.
 */
async function signInFromHome(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("banner").getByRole("link", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  await page.getByRole("textbox", { name: "E-mail" }).fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
}

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

  // Visitante vê a apresentação no Início.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Como funciona/ })).toBeVisible();
});

test("assinante: o Início é o painel completo", async ({ page }) => {
  await signInFromHome(page, accounts.email, accounts.password);

  // Continua no Início, que agora é o painel (sem a apresentação).
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Olá, Aluno!/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Como funciona/ })).toHaveCount(0);
  await expect(page.getByText("cortesia").first()).toBeVisible();

  const stats = page.getByRole("list", { name: "Seu desempenho" });
  await expect(stats.getByText("aula(s) concluída(s)")).toBeVisible();
  await expect(stats.getByText("de aula concluída")).toBeVisible();
  await expect(stats.getByText("atividade(s) feita(s)")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sua sequência" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Estudo nos últimos 28 dias" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Atividades para fazer" })).toBeVisible();
  const courses = page.getByRole("region", { name: "Minhas disciplinas" });
  await expect(courses.getByRole("link", { name: /Próxima:/ })).toBeVisible();

  // O endereço antigo leva ao Início.
  await page.goto("/minha-area");
  await expect(page).toHaveURL(/\/$/);

  // Assinante de Física I: sem convite na última aula grátis.
  await page.goto(LAST_FREE);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Aulas com cadeado são para assinantes")).toHaveCount(0);
});

test("sem assinatura: painel simples com a chamada para assinar", async ({ page }) => {
  await signInFromHome(page, accounts.freeEmail, accounts.freePassword);

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1, name: /Olá, Gratuito!/ })).toBeVisible();
  await expect(page.getByText("versão gratuita")).toBeVisible();
  const call = page.getByRole("region", { name: /Libere todas as aulas/ });
  await expect(call.getByText(/R\$/).first()).toBeVisible();
  await expect(call.getByRole("link", { name: "Quero assinar" })).toBeVisible();
  await expect(page.getByText("Boas-vindas!")).toBeVisible();
  await expect(page.getByRole("list", { name: "Aulas grátis" })).toBeVisible();
  // O painel completo é só do assinante.
  await expect(page.getByRole("heading", { name: "Atividades para fazer" })).toHaveCount(0);

  // Sem assinatura, recebe o convite na última aula grátis.
  await page.goto(LAST_FREE);
  await expect(page.getByRole("dialog", { name: /última aula grátis/ })).toBeVisible();
});
