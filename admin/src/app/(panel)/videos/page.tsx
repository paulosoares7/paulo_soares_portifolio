import type { Metadata } from "next";
import Link from "next/link";
import { Link2, Pencil, Plus, RefreshCw, Trash2, Unlink } from "lucide-react";
import { prisma } from "@portfolio/database";
import { courseCatalogOrder } from "@/lib/catalog-order";
import { deleteVideo, refreshVideoStatus, unlinkLessonVideo } from "@/actions/videos";
import { BunnyUploadForm } from "@/components/forms/BunnyUploadForm";
import { LinkLessonForm, type LessonGroup } from "@/components/forms/LinkLessonForm";
import { VideoLinkForm } from "@/components/forms/VideoLinkForm";
import { VideoTitleForm } from "@/components/forms/VideoTitleForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { isBunnyConfigured } from "@/lib/bunny";
import { formatDuration } from "@/lib/format";
import { VIDEO_PROVIDERS, VIDEO_STATUSES } from "@/lib/labels";

export const metadata: Metadata = { title: "Vídeos" };

const STATUS_TONE = {
  uploading: "warning",
  processing: "warning",
  ready: "success",
  failed: "danger",
} as const;

/** Vídeos: envio ao Bunny, links externos, status e vínculo com aulas (RF26). */
export default async function VideosPage() {
  const [videos, courses, lessonsWithoutVideo] = await Promise.all([
    prisma.video.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            isPreview: true,
            topic: {
              select: {
                module: { select: { courseId: true, course: { select: { title: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.course.findMany({
      where: { status: { not: "archived" } },
      orderBy: courseCatalogOrder,
      select: {
        title: true,
        modules: {
          orderBy: { sortOrder: "asc" },
          select: {
            title: true,
            topics: {
              orderBy: { sortOrder: "asc" },
              select: {
                lessons: {
                  orderBy: { sortOrder: "asc" },
                  select: { id: true, title: true, isPreview: true, videoId: true },
                },
              },
            },
          },
        },
      },
    }),
    prisma.lesson.count({ where: { videoId: null } }),
  ]);
  const bunnyReady = isBunnyConfigured();

  const groups: LessonGroup[] = courses.map((course) => ({
    course: course.title,
    lessons: course.modules.flatMap((m) =>
      m.topics.flatMap((t) =>
        t.lessons.map((l) => ({
          id: l.id,
          label: `${m.title} › ${l.title}${l.isPreview ? " (grátis)" : ""}${l.videoId ? "" : " — sem vídeo"}`,
        })),
      ),
    ),
  }));

  return (
    <>
      <PageHeader
        title="Vídeos"
        description={`Vídeo pago vai para o Bunny; aula grátis usa YouTube. ${lessonsWithoutVideo} aula(s) ainda sem vídeo.`}
        actions={
          <ModalTrigger
            label={
              <>
                <Plus className="size-4" aria-hidden /> Novo link
              </>
            }
            title="Vídeo por link"
            variant="primary"
            size="md"
          >
            <VideoLinkForm />
          </ModalTrigger>
        }
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle>Enviar vídeo pago (Bunny Stream)</CardTitle>
          <BunnyUploadForm bunnyReady={bunnyReady} />
        </Card>

        {videos.length === 0 ? (
          <EmptyState>Nenhum vídeo cadastrado.</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Vídeo</Th>
                <Th>Status</Th>
                <Th>Duração</Th>
                <Th>Aulas</Th>
                <Th className="text-right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {videos.map((video) => (
                <tr key={video.id}>
                  <Td>
                    <p className="font-medium">{video.title}</p>
                    <p className="text-muted flex flex-wrap items-center gap-2 text-xs">
                      <Badge tone={video.origin === "hosted" ? "accent" : "neutral"}>
                        {VIDEO_PROVIDERS[video.provider]}
                      </Badge>
                      <span className="break-all">
                        {video.externalUrl ?? video.providerVideoId}
                      </span>
                    </p>
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[video.status]}>{VIDEO_STATUSES[video.status]}</Badge>
                  </Td>
                  <Td className="text-muted">{formatDuration(video.durationSeconds)}</Td>
                  <Td>
                    {video.lessons.length === 0 ? (
                      <span className="text-muted text-xs">Não usado</span>
                    ) : (
                      <ul className="flex flex-col gap-1">
                        {video.lessons.map((lesson) => (
                          <li key={lesson.id} className="flex items-center gap-1 text-xs">
                            <Link
                              href={`/disciplinas/${lesson.topic.module.courseId}/aulas/${lesson.id}`}
                              className="hover:text-accent"
                            >
                              {lesson.topic.module.course.title} › {lesson.title}
                            </Link>
                            {lesson.isPreview ? <Badge tone="success">grátis</Badge> : null}
                            <ActionButton
                              action={unlinkLessonVideo.bind(null, lesson.id)}
                              confirm="Tirar o vídeo desta aula?"
                              title="Desvincular"
                            >
                              <Unlink className="size-3.5" aria-hidden />
                            </ActionButton>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      {video.provider === "bunny" && bunnyReady ? (
                        <ActionButton
                          action={refreshVideoStatus.bind(null, video.id)}
                          title="Atualizar status no Bunny"
                        >
                          <RefreshCw className="size-4" aria-hidden />
                        </ActionButton>
                      ) : null}
                      <ModalTrigger
                        label={<Link2 className="size-4" aria-hidden />}
                        title={`Vincular "${video.title}" a uma aula`}
                        variant="ghost"
                        ariaLabel="Vincular a uma aula"
                      >
                        <LinkLessonForm videoId={video.id} groups={groups} />
                      </ModalTrigger>
                      <ModalTrigger
                        label={<Pencil className="size-4" aria-hidden />}
                        title="Editar vídeo"
                        variant="ghost"
                        ariaLabel={`Editar ${video.title}`}
                      >
                        {video.origin === "external" ? (
                          <VideoLinkForm
                            item={{
                              id: video.id,
                              title: video.title,
                              provider: video.provider,
                              externalUrl: video.externalUrl ?? "",
                              duration:
                                video.durationSeconds != null
                                  ? formatDuration(video.durationSeconds)
                                  : "",
                            }}
                          />
                        ) : (
                          <VideoTitleForm item={{ id: video.id, title: video.title }} />
                        )}
                      </ModalTrigger>
                      <ActionButton
                        action={deleteVideo.bind(null, video.id)}
                        confirm={`Remover "${video.title}"? As aulas que usam este vídeo ficam como "vídeo em breve".`}
                        title="Remover"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </ActionButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </>
  );
}
