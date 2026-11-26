"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { parseForm } from "@/lib/form";
import { decodeLattesFile, parseLattesXml } from "@/lib/lattes-parser";
import { fetchOrcidWorks, isOrcidId } from "@/lib/orcid";
import { buildImportPreview } from "@/lib/publication-import";
import type { ActionState } from "@/types/action";
import type { PreviewResult } from "@/types/publication";
import { applyImportSchema, publicationSchema } from "@/validators/publication";

const PATH = "/publicacoes";
// Limite do XML: currículos grandes ficam em 1–3 MB; o .zip, bem menos.
const MAX_LATTES_BYTES = 15 * 1024 * 1024;

/**
 * Cria ou atualiza uma publicação cadastrada à mão.
 * @param _state Estado anterior.
 * @param formData Campos da publicação.
 * @returns Erros do formulário; em caso de sucesso volta para a lista.
 */
export async function savePublication(
  _state: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = parseForm(publicationSchema, formData);
  if (!parsed.success) return parsed.state;
  const { id, ...data } = parsed.data;
  try {
    if (id) await prisma.publication.update({ where: { id }, data });
    else await prisma.publication.create({ data: { ...data, source: "manual" } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATH);
  redirect(PATH);
}

/** Remove uma publicação. */
export async function deletePublication(id: number): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.publication.delete({ where: { id } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Liga/desliga "destaque na home" ou "visível no site".
 * @param id ID da publicação.
 * @param field Campo a alternar.
 * @param value Novo valor.
 */
export async function togglePublication(
  id: number,
  field: "isFeatured" | "isVisible",
  value: boolean,
): Promise<ActionState> {
  await requireAdmin();
  try {
    await prisma.publication.update({ where: { id }, data: { [field]: value } });
  } catch (error) {
    return actionError(error);
  }
  revalidatePath(PATH);
  return { ok: true };
}

/**
 * Lê o XML (ou ZIP) do Lattes e devolve a prévia, sem gravar nada.
 * @param formData Campo "file" com o arquivo.
 * @returns Prévia ou erro.
 */
export async function previewLattes(formData: FormData): Promise<PreviewResult> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, message: "Escolha o arquivo XML do Lattes." };
  if (file.size > MAX_LATTES_BYTES)
    return { ok: false, message: "Arquivo grande demais (máximo 15 MB)." };

  try {
    const xml = decodeLattesFile(new Uint8Array(await file.arrayBuffer()));
    const result = parseLattesXml(xml);
    if (result.items.length === 0)
      return { ok: false, message: "Nenhuma publicação encontrada neste currículo." };
    return {
      ok: true,
      source: "lattes",
      fileName: file.name.slice(0, 255),
      lattesUpdatedAt: result.updatedAt,
      sourceLabel: `Lattes${result.ownerName ? ` de ${result.ownerName}` : ""}`,
      items: await buildImportPreview("lattes", result.items),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível ler o arquivo.",
    };
  }
}

/**
 * Busca as publicações públicas no ORCID e devolve a prévia, sem gravar nada.
 * Usa o ORCID iD do perfil; se vazio ou genérico, o ORCID_ID do ambiente.
 * @returns Prévia ou erro.
 */
export async function previewOrcid(): Promise<PreviewResult> {
  await requireAdmin();
  const profile = await prisma.profile.findUnique({
    where: { id: 1 },
    select: { orcidId: true, fullName: true },
  });
  const candidates = [profile?.orcidId, process.env.ORCID_ID].filter(
    (value): value is string => isOrcidId(value) && value !== "0000-0000-0000-0000",
  );
  const orcidId = candidates[0];
  if (!orcidId)
    return { ok: false, message: "Cadastre o seu ORCID iD no Perfil antes de sincronizar." };

  try {
    const items = await fetchOrcidWorks(orcidId, profile?.fullName ?? "Autor");
    if (items.length === 0)
      return { ok: false, message: `Nenhuma publicação pública no ORCID ${orcidId}.` };
    return {
      ok: true,
      source: "orcid",
      fileName: null,
      lattesUpdatedAt: null,
      sourceLabel: `ORCID ${orcidId}`,
      items: await buildImportPreview("orcid", items),
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Falha ao consultar o ORCID.",
    };
  }
}

/**
 * Grava os itens escolhidos na prévia e registra a importação em import_jobs.
 * @param input { source, fileName, totalInPreview, lattesUpdatedAt, items }.
 * @returns Resumo do que foi criado e atualizado.
 */
export async function applyImport(input: unknown): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = applyImportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados da importação inválidos." };
  const { source, fileName, totalInPreview, lattesUpdatedAt, items } = parsed.data;

  const job = await prisma.importJob.create({
    data: {
      source: source === "lattes" ? "lattes_xml" : "orcid_api",
      fileName,
      startedBy: admin.id,
    },
  });

  try {
    const existing = await prisma.publication.findMany({
      where: { source, externalId: { in: items.map((i) => i.externalId) } },
      select: { externalId: true },
    });
    const existingIds = new Set(existing.map((p) => p.externalId));

    await prisma.$transaction(
      async (tx) => {
        for (const item of items) {
          const { externalId, ...data } = item;
          await tx.publication.upsert({
            where: { source_externalId: { source, externalId } },
            create: { ...data, source, externalId },
            update: data,
          });
        }
        if (source === "lattes" && lattesUpdatedAt) {
          await tx.profile.updateMany({
            where: { id: 1 },
            data: { lattesUpdatedAt: new Date(`${lattesUpdatedAt}T00:00:00Z`) },
          });
        }
      },
      { timeout: 60000 },
    );

    const updated = items.filter((i) => existingIds.has(i.externalId)).length;
    const created = items.length - updated;
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "success",
        itemsCreated: created,
        itemsUpdated: updated,
        itemsSkipped: Math.max(totalInPreview - items.length, 0),
        finishedAt: new Date(),
      },
    });
    revalidatePath(PATH);
    revalidatePath(`${PATH}/importar`);
    return {
      ok: true,
      message: `Importação concluída: ${created} nova(s), ${updated} atualizada(s).`,
    };
  } catch (error) {
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        message: error instanceof Error ? error.message.slice(0, 2000) : "Erro",
        finishedAt: new Date(),
      },
    });
    return actionError(error, "A importação falhou. Nada foi gravado.");
  }
}
