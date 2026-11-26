// Consulta da página da aula (RF07). O link do vídeo só é lido quando o
// acesso foi liberado por lib/access.ts.
import { cache } from "react";
import { prisma } from "@portfolio/database";
import { checkAccess, getViewerStudentId } from "@/lib/access";
import { toPlayerSource, type PlayerSource } from "@/lib/video";

/**
 * Aula pelo endereço /disciplina/[curso]/[módulo]/[aula].
 * @param courseSlug Endereço da disciplina.
 * @param moduleSlug Endereço do módulo.
 * @param lessonSlug Endereço da aula.
 * @returns Dados da página ou null.
 */
export const getLessonPage = cache(
  async (courseSlug: string, moduleSlug: string, lessonSlug: string) => {
    const lesson = await prisma.lesson.findFirst({
      where: {
        slug: lessonSlug,
        status: "published",
        topic: {
          module: {
            slug: moduleSlug,
            status: "published",
            course: { slug: courseSlug, status: "published" },
          },
        },
      },
      select: {
        id: true,
        title: true,
        summary: true,
        content: true,
        isPreview: true,
        videoId: true,
        topic: {
          select: {
            title: true,
            module: {
              select: {
                id: true,
                slug: true,
                title: true,
                course: { select: { id: true, slug: true, title: true } },
              },
            },
          },
        },
      },
    });
    if (!lesson) return null;

    const { module } = lesson.topic;
    const studentId = await getViewerStudentId();
    const access = await checkAccess(
      { isPreview: lesson.isPreview, courseId: module.course.id },
      studentId,
    );

    // Fonte do vídeo: só consultada com acesso liberado (nada vai ao HTML de quem não assina).
    let player: PlayerSource | "locked" | "coming-soon" = "locked";
    if (access !== "locked") {
      const video = lesson.videoId
        ? await prisma.video.findUnique({
            where: { id: lesson.videoId },
            select: { provider: true, externalUrl: true, status: true },
          })
        : null;
      player = !video || video.status !== "ready" ? "coming-soon" : toPlayerSource(video);
    }

    const [moduleLessons, materials, discussions] = await Promise.all([
      prisma.lesson.findMany({
        where: { status: "published", topic: { moduleId: module.id } },
        orderBy: [{ topic: { sortOrder: "asc" } }, { sortOrder: "asc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          isPreview: true,
          video: { select: { durationSeconds: true, status: true } },
        },
      }),
      prisma.material.findMany({
        where: { lessonId: lesson.id },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          type: true,
          title: true,
          description: true,
          isPreview: true,
          fileId: true,
          externalUrl: true,
        },
      }),
      prisma.forumThread.count({
        where: { lessonId: lesson.id, status: "visible", type: { not: "announcement" } },
      }),
    ]);

    const sidebar = await Promise.all(
      moduleLessons.map(async (l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        summary: null,
        durationSeconds: l.video?.durationSeconds ?? null,
        hasVideo: !!l.video && l.video.status === "ready",
        access: await checkAccess(
          { isPreview: l.isPreview, courseId: module.course.id },
          studentId,
        ),
      })),
    );
    const position = moduleLessons.findIndex((l) => l.id === lesson.id);

    const materialItems = await Promise.all(
      materials.map(async (m) => {
        const itemAccess = await checkAccess(
          { isPreview: m.isPreview, courseId: module.course.id },
          studentId,
        );
        const isPdf = m.fileId !== null || /\.pdf($|\?)/i.test(m.externalUrl ?? "");
        return {
          id: m.id,
          type: m.type,
          title: m.title,
          description: m.description,
          where: "Esta aula",
          access: itemAccess,
          isPdf,
          openUrl: itemAccess !== "locked" && !isPdf ? m.externalUrl : null,
        };
      }),
    );

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        content: access === "locked" ? null : lesson.content,
        topic: lesson.topic.title,
      },
      module: { slug: module.slug, title: module.title },
      course: module.course,
      access,
      player,
      sidebar,
      previous: position > 0 ? moduleLessons[position - 1] : null,
      next:
        position >= 0 && position < moduleLessons.length - 1 ? moduleLessons[position + 1] : null,
      materials: materialItems,
      discussions,
    };
  },
);
