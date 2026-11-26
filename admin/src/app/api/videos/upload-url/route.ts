import { NextResponse } from "next/server";
import { prisma } from "@portfolio/database";
import { getCurrentAdmin } from "@/lib/auth";
import {
  BUNNY_TUS_ENDPOINT,
  createBunnyVideo,
  isBunnyConfigured,
  signBunnyUpload,
} from "@/lib/bunny";
import { bunnyUploadSchema } from "@/validators/media";

// Assinatura válida por 6 h: tempo de sobra para enviar vídeos longos.
const UPLOAD_WINDOW_SECONDS = 6 * 60 * 60;

/**
 * Prepara o envio direto ao Bunny: cria o vídeo lá, grava o registro em
 * `videos` (status uploading) e devolve a assinatura TUS para o navegador.
 * @param request JSON { title }.
 * @returns Dados do envio TUS ou erro.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!(await getCurrentAdmin())) {
    return NextResponse.json({ error: "Sessão expirada. Entre de novo." }, { status: 401 });
  }
  if (!isBunnyConfigured()) {
    return NextResponse.json(
      { error: "Bunny não configurado (BUNNY_* no .env.local)." },
      { status: 503 },
    );
  }
  const parsed = bunnyUploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Informe o título do vídeo." }, { status: 400 });

  try {
    const guid = await createBunnyVideo(parsed.data.title);
    const video = await prisma.video.create({
      data: {
        title: parsed.data.title,
        origin: "hosted",
        provider: "bunny",
        providerVideoId: guid,
        status: "uploading",
      },
    });
    const expiresAt = Math.floor(Date.now() / 1000) + UPLOAD_WINDOW_SECONDS;
    const { libraryId, signature } = signBunnyUpload(guid, expiresAt);
    return NextResponse.json({
      id: video.id,
      guid,
      libraryId,
      signature,
      expiresAt,
      endpoint: BUNNY_TUS_ENDPOINT,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao preparar o envio." },
      { status: 502 },
    );
  }
}
