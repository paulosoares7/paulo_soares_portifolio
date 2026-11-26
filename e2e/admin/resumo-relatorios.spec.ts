// Etapa 3: menu lateral, gráficos do Resumo e Relatórios (CSV e PDF).
import { expect, test } from "@playwright/test";

test("menu: seção recolhe e o estado fica salvo", async ({ page }) => {
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Portfólio" });
  const perfil = page.getByRole("link", { name: "Perfil" });
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(perfil).toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(perfil).toBeHidden();
  await page.reload();
  await expect(page.getByRole("button", { name: "Portfólio" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  // Volta ao normal para não afetar outros testes.
  await page.getByRole("button", { name: "Portfólio" }).click();
  await expect(perfil).toBeVisible();
});

test("resumo mostra os gráficos e troca o período", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Gráficos" })).toBeVisible();
  for (const title of [
    "Público agora",
    "Novos cadastros e assinaturas",
    "Cancelamentos",
    "Receita por mês",
    "Disciplinas mais escolhidas",
    "Aulas mais assistidas",
    "Atividades mais feitas",
  ]) {
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
  }
  await page.getByRole("link", { name: "7 dias" }).click();
  await expect(page).toHaveURL(/periodo=7d/);
  await expect(page.getByRole("link", { name: "7 dias" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("heading", { name: "Acessos por dia" })).toBeVisible();

  await page.getByRole("link", { name: "12 meses" }).click();
  await expect(page.getByRole("heading", { name: "Acessos por mês" })).toBeVisible();
});

test("relatórios: abas, busca, CSV e página para PDF", async ({ page }) => {
  await page.goto("/relatorios");
  await expect(page.getByRole("heading", { name: "Relatórios" })).toBeVisible();
  await page.getByRole("link", { name: "Uso por disciplina" }).click();
  await expect(page.getByRole("columnheader", { name: "Alunos nas vagas" })).toBeVisible();
  await expect(page.getByRole("link", { name: "30 dias" })).toBeVisible();

  await page.getByRole("searchbox", { name: /Buscar/ }).fill("Física I");
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(/q=F/);
  await expect(page.getByRole("cell", { name: "Física I", exact: true })).toBeVisible();

  const csv = await page.request.get("/api/relatorios?relatorio=uso-disciplina");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const body = await csv.text();
  expect(body.startsWith('﻿"Disciplina";')).toBe(true);

  await page.goto("/relatorios/imprimir?relatorio=cortesias");
  await expect(page.getByRole("heading", { name: "Relatório: Cortesias" })).toBeVisible();
});

test("relatórios exigem login", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  const response = await context.request.get("http://localhost:3001/api/relatorios", {
    maxRedirects: 0,
  });
  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  await context.close();
});
