"use server";

import { prisma } from "@portfolio/database";
import { actionError } from "@/lib/action-error";
import { requireAdmin } from "@/lib/auth";
import { headObject, publicUrlFor } from "@/lib/storage";
import { UPLOAD_RULES } from "@/lib/upload-kinds";
import type { ActionState } from "@/types/action";
import { uploadRegisterSchema } from "@/validators/upload";

/**
 * Registra em media_files um arquivo que o navegador acabou de enviar ao bucket.
 * Confere no storage que o arquivo existe e respeita as regras do tipo.
 * @param input { kind, storageKey, originalName }.
 * @returns ActionState com o ID do arquivo criado.
 */
export async function registerUpload(
  input: unknown,
): Promise<ActionState & { mediaFileId?: number }> {
  const admin = await requireAdmin();
  const parsed = uploadRegisterSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Dados do envio inválidos." };

  const { kind, storageKey, originalName } = parsed.data;
  const rule = UPLOAD_RULES[kind];
  // A chave precisa estar na pasta do tipo: impede registrar arquivos de outro lugar.
  if (!storageKey.startsWith(`${rule.folder}/`))
    return { ok: false, message: "Chave de arquivo inválida." };

  const object = await headObject(storageKey);
  if (!object)
    return { ok: false, message: "O arquivo não chegou ao storage. Tente enviar de novo." };
  if (
    object.size > rule.maxBytes ||
    (object.contentType && !rule.accept.includes(object.contentType))
  ) {
    return { ok: false, message: `Arquivo fora das regras. ${rule.label}.` };
  }

  try {
    const file = await prisma.mediaFile.create({
      data: {
        storageKey,
        originalName,
        mimeType: object.contentType ?? rule.accept[0] ?? "application/octet-stream",
        sizeBytes: object.size,
        isPrivate: rule.isPrivate,
        publicUrl: rule.isPrivate ? null : publicUrlFor(storageKey),
        uploadedBy: admin.id,
      },
    });
    return { ok: true, message: "Arquivo enviado.", mediaFileId: file.id };
  } catch (error) {
    return actionError(error, "Não foi possível registrar o arquivo.");
  }
}
