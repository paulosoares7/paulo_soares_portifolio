// Materiais por link externo: validação https, avisos, Drive convertido,
// ícone na lista, Drive embutido na plataforma e regra de acesso (material
// pago por link não sai no HTML de quem não tem acesso).
import { expect, test, type Page } from "@playwright/test";

const PLATAFORMA = "http://localhost:3002";
const DRIVE_ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345";
const PAID_DRIVE_ID = "1PaGoPaGoPaGoPaGoPaGoPaGoPaGo98765";

/** Abre "Novo material" na Física I e escolhe "Colar link externo". */
async function openLinkForm(page: Page) {
  await page.goto("/materiais");
  await page.getByRole("button", { name: "Novo material" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Disciplina").selectOption({ label: "Física I" });
  return dialog;
}

/** Remove um material pela lista (confirmação do navegador). */
async function removeMaterial(page: Page, title: string) {
  await page.goto("/materiais");
  const row = page.getByRole("row").filter({ hasText: title });
  page.once("dialog", (confirm) => confirm.accept());
  await row.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByRole("row").filter({ hasText: title })).toHaveCount(0);
}

test("material por link: validação, avisos e teste do link", async ({ page }) => {
  const dialog = await openLinkForm(page);

  // Sem storage configurado, "Enviar arquivo" fica desativado com o aviso.
  await dialog.getByRole("button", { name: "Enviar arquivo" }).click();
  await expect(dialog.getByText("Configure o armazenamento para enviar arquivos")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Enviar PDF" })).toBeDisabled();

  await dialog.getByRole("button", { name: "Colar link externo" }).click();
  const url = dialog.locator("#mat-url");
  await expect(
    dialog.getByText("Materiais por link externo não têm a proteção dos PDFs enviados"),
  ).toBeVisible();

  // Só https.
  await url.fill("http://exemplo.com/lista.pdf");
  await dialog.getByLabel("Título").focus();
  await expect(dialog.getByText(/começando com https:\/\//)).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Testar link" })).toBeDisabled();

  // Discord: aviso de link que expira.
  await url.fill("https://cdn.discordapp.com/attachments/1/2/lista.pdf");
  await expect(
    dialog.getByText("Links de arquivos do Discord expiram e podem parar de funcionar."),
  ).toBeVisible();

  // Drive: mostra como será salvo.
  await url.fill(`https://drive.google.com/open?id=${DRIVE_ID}&usp=sharing`);
  await expect(
    dialog.getByText(`https://drive.google.com/file/d/${DRIVE_ID}/view`, { exact: false }),
  ).toBeVisible();

  // "Testar link" recusa endereços internos (o servidor não sonda a rede local).
  await url.fill("https://localhost:3002/");
  await dialog.getByRole("button", { name: "Testar link" }).click();
  await expect(dialog.getByText(/Endereço não permitido/)).toBeVisible();
});

test("material por link: lista, Drive embutido e acesso na plataforma", async ({ page }) => {
  const stamp = Date.now();
  const free = `Lista Drive grátis ${stamp}`;
  const paid = `Lista Drive paga ${stamp}`;

  for (const [title, isFree, driveId] of [
    [free, true, DRIVE_ID],
    [paid, false, PAID_DRIVE_ID],
  ] as const) {
    const dialog = await openLinkForm(page);
    await dialog.getByLabel("Título").fill(title);
    await dialog.getByRole("button", { name: "Colar link externo" }).click();
    await dialog.locator("#mat-url").fill(`https://drive.google.com/file/d/${driveId}/edit`);
    if (isFree) await dialog.getByRole("checkbox", { name: /Grátis/ }).check();
    await dialog.getByRole("button", { name: "Salvar" }).click();
    await expect(dialog).toBeHidden();
  }

  // Lista do admin: ícone de link e o serviço.
  const row = page.getByRole("row").filter({ hasText: free });
  await expect(row.getByRole("img", { name: "Link externo" })).toBeVisible();
  await expect(row.getByText("Link: Google Drive")).toBeVisible();

  // Plataforma (visitante): o grátis abre embutido; o pago não manda o link.
  const visitor = await page.context().browser()!.newPage();
  await visitor.goto(`${PLATAFORMA}/disciplina/fisica-1?aba=materiais`);
  const item = visitor.getByRole("listitem").filter({ hasText: free });
  await item.getByRole("button", { name: "Ver aqui" }).click();
  await expect(item.locator("iframe")).toHaveAttribute(
    "src",
    `https://drive.google.com/file/d/${DRIVE_ID}/preview`,
  );
  await expect(item.getByRole("link", { name: /Nova aba/ })).toHaveAttribute(
    "href",
    `https://drive.google.com/file/d/${DRIVE_ID}/view`,
  );
  const paidItem = visitor.getByRole("listitem").filter({ hasText: paid });
  await expect(paidItem.getByText("Assinantes")).toBeVisible();
  // O endereço do material pago não pode estar em lugar nenhum do HTML.
  expect(await visitor.content()).not.toContain(PAID_DRIVE_ID);
  await visitor.close();
});

test.afterEach(async ({ page }) => {
  // Limpa os materiais criados, mesmo se o teste falhou no meio.
  await page.goto("/materiais");
  for (const title of await page
    .getByRole("row")
    .filter({ hasText: /Lista Drive (grátis|paga) \d+/ })
    .allInnerTexts()) {
    const name = title.match(/Lista Drive (grátis|paga) \d+/)?.[0];
    if (name) await removeMaterial(page, name);
  }
});
