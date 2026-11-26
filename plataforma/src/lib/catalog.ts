// Consultas do catálogo e da página da disciplina. Só conteúdo publicado.
// Nenhuma URL de vídeo é lida aqui: a página da aula pede a fonte só depois
// de checar o acesso (lib/access.ts).
import { cache } from "react";
import { prisma } from "@portfolio/database";
import { checkAccess, getViewerStudentId, type Access } from "@/lib/access";

/** Filtro de aula visível no site: publicada, em módulo e disciplina publicados. */
const publishedLesson = {
  status: "published",
  topic: { module: { status: "published", course: { status: "published" } } },
} as const;

/** Cartão de disciplina do catálogo. */
export type CourseCardData = {
  id: number;
  slug: string;
  title: string;
  shortDescription: string;
  icon: string | null;
  color: string | null;
  lessons: number;
  freeItems: number;
};

/**
 * Seções do catálogo com os grupos e as disciplinas publicadas (RF05).
 * Categoria → Grupo → Disciplina; `courses` traz todas as da categoria
 * (na ordem dos grupos) para contagens e listas simples.
 * @returns Categorias na ordem do painel, cada uma com grupos e cartões.
 */
export const getCatalog = cache(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      groups: {
        orderBy: { sortOrder: "asc" },
        include: {
          courses: {
            where: { status: "published" },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              slug: true,
              title: true,
              shortDescription: true,
              icon: true,
              color: true,
            },
          },
        },
      },
    },
  });
  const courseIds = categories.flatMap((c) =>
    c.groups.flatMap((g) => g.courses.map((course) => course.id)),
  );

  // Contagens agrupadas: aulas publicadas, aulas grátis e atividades grátis por disciplina.
  const [lessons, activities] = await Promise.all([
    prisma.lesson.findMany({
      where: {
        ...publishedLesson,
        topic: { module: { status: "published", courseId: { in: courseIds } } },
      },
      select: { isPreview: true, topic: { select: { module: { select: { courseId: true } } } } },
    }),
    prisma.activity.findMany({
      where: {
        isPreview: true,
        status: "published",
        module: { status: "published", courseId: { in: courseIds } },
      },
      select: { module: { select: { courseId: true } } },
    }),
  ]);
  const lessonCount = new Map<number, number>();
  const freeCount = new Map<number, number>();
  for (const lesson of lessons) {
    const id = lesson.topic.module.courseId;
    lessonCount.set(id, (lessonCount.get(id) ?? 0) + 1);
    if (lesson.isPreview) freeCount.set(id, (freeCount.get(id) ?? 0) + 1);
  }
  for (const activity of activities) {
    const id = activity.module.courseId;
    freeCount.set(id, (freeCount.get(id) ?? 0) + 1);
  }

  const toCard = (course: (typeof categories)[number]["groups"][number]["courses"][number]) =>
    ({
      ...course,
      lessons: lessonCount.get(course.id) ?? 0,
      freeItems: freeCount.get(course.id) ?? 0,
    }) satisfies CourseCardData;

  return categories.map((category) => {
    const groups = category.groups.map((group) => ({
      id: group.id,
      slug: group.slug,
      name: group.name,
      description: group.description,
      courses: group.courses.map(toCard),
    }));
    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      groups,
      courses: groups.flatMap((g) => g.courses),
    };
  });
});

/** Categoria do catálogo, com grupos e cartões. */
export type CatalogCategory = Awaited<ReturnType<typeof getCatalog>>[number];

/** Aula na lista da disciplina, já com o acesso do visitante. */
export type LessonListItem = {
  id: number;
  slug: string;
  title: string;
  summary: string | null;
  durationSeconds: number | null;
  hasVideo: boolean;
  access: Access;
};

/**
 * Página da disciplina (RF06): módulos → temas → aulas, atividades, materiais
 * e avisos, cada item com o acesso já decidido por lib/access.ts.
 * @param slug Endereço da disciplina.
 * @returns Dados da página ou null se não existir/não estiver publicada.
 */
export const getCoursePage = cache(async (slug: string) => {
  const course = await prisma.course.findFirst({
    where: { slug, status: "published" },
    include: {
      group: {
        select: { slug: true, name: true, category: { select: { slug: true, name: true } } },
      },
      coverFile: { select: { publicUrl: true } },
      modules: {
        where: { status: "published" },
        orderBy: { sortOrder: "asc" },
        include: {
          topics: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                where: { status: "published" },
                orderBy: { sortOrder: "asc" },
                // Só o necessário para a lista: nada de link ou ID do vídeo.
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  summary: true,
                  isPreview: true,
                  video: { select: { durationSeconds: true, status: true } },
                },
              },
            },
          },
          activities: {
            where: { status: "published" },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              difficulty: true,
              isPreview: true,
              _count: { select: { questions: true } },
            },
          },
        },
      },
    },
  });
  if (!course) return null;

  const studentId = await getViewerStudentId();
  const access = (isPreview: boolean) => checkAccess({ isPreview, courseId: course.id }, studentId);

  const modules = await Promise.all(
    course.modules.map(async (mod) => ({
      id: mod.id,
      slug: mod.slug,
      title: mod.title,
      description: mod.description,
      topics: await Promise.all(
        mod.topics
          .filter((topic) => topic.lessons.length > 0)
          .map(async (topic) => ({
            id: topic.id,
            title: topic.title,
            lessons: await Promise.all(
              topic.lessons.map(async (lesson): Promise<LessonListItem> => ({
                id: lesson.id,
                slug: lesson.slug,
                title: lesson.title,
                summary: lesson.summary,
                durationSeconds: lesson.video?.durationSeconds ?? null,
                // Vídeo hospedado ainda processando conta como "em breve".
                hasVideo: !!lesson.video && lesson.video.status === "ready",
                access: await access(lesson.isPreview),
              })),
            ),
          })),
      ),
      activities: await Promise.all(
        mod.activities.map(async (activity) => ({
          id: activity.id,
          title: activity.title,
          difficulty: activity.difficulty,
          questions: activity._count.questions,
          access: await access(activity.isPreview),
        })),
      ),
    })),
  );

  const moduleIds = course.modules.map((m) => m.id);
  const lessonIds = modules.flatMap((m) => m.topics.flatMap((t) => t.lessons.map((l) => l.id)));
  const [materials, announcements] = await Promise.all([
    prisma.material.findMany({
      where: {
        OR: [
          { courseId: course.id },
          { moduleId: { in: moduleIds } },
          { lessonId: { in: lessonIds } },
        ],
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        isPreview: true,
        fileId: true,
        externalUrl: true,
        module: { select: { title: true } },
        lesson: { select: { title: true } },
      },
    }),
    // RN13: visitantes leem os avisos; discussões ficam para assinantes.
    prisma.forumThread.findMany({
      where: { courseId: course.id, type: "announcement", status: "visible" },
      orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
      take: 20,
      include: {
        adminUser: { select: { name: true } },
        posts: {
          where: { status: "visible" },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          take: 1,
          select: { body: true, createdAt: true, reactions: { select: { type: true } } },
        },
      },
    }),
  ]);

  const materialItems = await Promise.all(
    materials.map(async (m) => {
      const itemAccess = await access(m.isPreview);
      // Link externo só sai do servidor para quem tem acesso; PDF nunca vira link direto (RN12).
      const isPdf = m.fileId !== null || /\.pdf($|\?)/i.test(m.externalUrl ?? "");
      return {
        id: m.id,
        type: m.type,
        title: m.title,
        description: m.description,
        where: m.lesson
          ? `Aula: ${m.lesson.title}`
          : m.module
            ? `Módulo: ${m.module.title}`
            : "Disciplina",
        access: itemAccess,
        isPdf,
        openUrl: itemAccess !== "locked" && !isPdf ? m.externalUrl : null,
      };
    }),
  );

  const announcementItems = announcements
    .filter((t) => t.posts[0])
    .map((t) => {
      const post = t.posts[0];
      const reactions = { like: 0, love: 0, celebrate: 0 };
      for (const r of post?.reactions ?? []) reactions[r.type] += 1;
      return {
        id: t.id,
        title: t.title,
        isPinned: t.isPinned,
        author: t.adminUser?.name ?? "Professor",
        body: post?.body ?? "",
        createdAt: post?.createdAt ?? t.createdAt,
        reactions,
      };
    });

  const allLessons = modules.flatMap((m) => m.topics.flatMap((t) => t.lessons));
  const allActivities = modules.flatMap((m) => m.activities);
  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      shortDescription: course.shortDescription,
      description: course.description,
      icon: course.icon,
      color: course.color,
      coverUrl: course.coverFile?.publicUrl ?? null,
      category: course.group.category,
      group: { slug: course.group.slug, name: course.group.name },
    },
    modules,
    materials: materialItems,
    announcements: announcementItems,
    stats: {
      modules: modules.length,
      lessons: allLessons.length,
      activities: allActivities.length,
      free:
        allLessons.filter((l) => l.access === "free").length +
        allActivities.filter((a) => a.access === "free").length,
      locked:
        allLessons.some((l) => l.access === "locked") ||
        allActivities.some((a) => a.access === "locked"),
    },
  };
});

/** Dados completos da página da disciplina. */
export type CoursePageData = NonNullable<Awaited<ReturnType<typeof getCoursePage>>>;

/**
 * Plano à venda (para a chamada "Assinar").
 * @returns Primeiro plano ativo ou null.
 */
export const getActivePlan = cache(async () =>
  prisma.plan.findFirst({
    where: { isActive: true },
    orderBy: { id: "asc" },
    select: {
      name: true,
      description: true,
      priceCents: true,
      maxCourses: true,
      billingCycle: true,
    },
  }),
);
