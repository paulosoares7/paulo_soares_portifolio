// Link "Aulas" do portfólio. Com NEXT_PUBLIC_PLATAFORMA_URL vazia (plataforma
// fora do ar), todos os links "Aulas" levam ao aviso /aulas. Com o endereço
// preenchido, o teste é pulado (os links vão direto para a plataforma).
import { expect, test } from "@playwright/test";

test("plataforma fora do ar: Aulas mostra 'Em desenvolvimento'", async ({ page }) => {
  await page.goto("/");
  const menuLink = page.getByRole("navigation", { name: "Principal" }).getByRole("link", {
    name: "Aulas",
  });
  const href = await menuLink.getAttribute("href");
  test.skip(href !== "/aulas", "Plataforma no ar: os links vão direto para ela.");

  // Seção da home com o selo e o botão para o aviso.
  const section = page.getByRole("region", { name: "Física para estudar do seu jeito" });
  await expect(section.getByText("em desenvolvimento", { exact: true })).toBeVisible();
  await expect(section.getByRole("link", { name: "Saiba mais" })).toHaveAttribute("href", "/aulas");

  // Menu leva ao aviso, que fica fora dos buscadores.
  await menuLink.click();
  await expect(page).toHaveURL(/\/aulas$/);
  await expect(page.getByRole("heading", { level: 1, name: "Em desenvolvimento" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("link", { name: "Fale comigo" })).toHaveAttribute("href", "/contato");
});
