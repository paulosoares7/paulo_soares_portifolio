import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { buildStorageKey, createUploadUrl, isStorageConfigured } from "@/lib/storage";
import { UPLOAD_RULES } from "@/lib/upload-kinds";
import { uploadRequestSchema } from "@/validators/upload";

/**
 * Gera a URL assinada para o navegador enviar um arquivo direto ao storage.
 * @param request JSON { kind, fileName, contentType, size }.
 * @returns { uploadUrl, storageKey } ou erro.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "Storage não configurado (STORAGE_* no .env.local)." },
      { status: 503 },
    );
  }

  const parsed = uploadRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Pedido inválido." },
      { status: 400 },
    );
  }

  const { kind, fileName, contentType } = parsed.data;
  const storageKey = buildStorageKey(UPLOAD_RULES[kind].folder, fileName);
  const uploadUrl = await createUploadUrl(storageKey, contentType);
  return NextResponse.json({ uploadUrl, storageKey });
}
