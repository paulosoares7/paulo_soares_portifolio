import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@portfolio/database";
import { LessonForm } from "@/components/forms/LessonForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadVideoOptions } from "@/lib/video-options";

export const metadata: Metadata = { title: "Aula" };

/** Edição completa da aula: vídeo, texto de apoio com LaTeX, grátis e status. */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const courseId = Number(id);
  const lessonNumber = Number(lessonId);
  if (!Number.isInteger(courseId) || !Number.isInteger(lessonNumber)) notFound();

  const [lesson, modules, videos] = await Promise.all([
    prisma.lesson.findFirst({
      where: { id: lessonNumber, topic: { module: { courseId } } },
      include: {
        topic: {
          include: { module: { include: { course: { select: { title: true, slug: true } } } } },
        },
      },
    }),
    prisma.module.findMany({
      where: { courseId },
      orderBy: { sortOrder: "asc" },
      include: { topics: { orderBy: { sortOrder: "asc" }, select: { id: true, title: true } } },
    }),
    loadVideoOptions(),
  ]);
  if (!lesson) notFound();

  const topics = modules.flatMap((m) =>
    m.topics.map((t) => ({ id: t.id, label: `${m.title} › ${t.title}` })),
  );
  const { module } = lesson.topic;

  return (
    <>
      <PageHeader
        title={lesson.title}
        back={{ href: `/disciplinas/${courseId}`, label: module.course.title }}
        description={`Endereço no site: /disciplina/${module.course.slug}/${module.slug}/${lesson.slug}`}
      />
      <Card>
        <LessonForm
          topics={topics}
          videos={videos}
          item={{
            id: lesson.id,
            topicId: lesson.topicId,
            videoId: lesson.videoId,
            slug: lesson.slug,
            title: lesson.title,
            summary: lesson.summary ?? "",
            content: lesson.content ?? "",
            isPreview: lesson.isPreview,
            status: lesson.status,
          }}
        />
      </Card>
    </>
  );
}
