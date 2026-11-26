import { prisma } from "@portfolio/database";
import { VIDEO_PROVIDERS } from "@/lib/labels";

/**
 * Vídeos para o seletor da aula ("Título · YouTube").
 * @returns Lista { id, label } ordenada pelo mais recente.
 */
export async function loadVideoOptions(): Promise<{ id: number; label: string }[]> {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, provider: true },
  });
  return videos.map((v) => ({ id: v.id, label: `${v.title} · ${VIDEO_PROVIDERS[v.provider]}` }));
}
