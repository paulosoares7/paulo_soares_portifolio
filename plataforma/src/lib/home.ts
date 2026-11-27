// Dados da página inicial e da página "Sobre o professor".
import { cache } from "react";
import { prisma } from "@portfolio/database";
import { imageUrl } from "@portfolio/database/external-link";

/** Aula grátis em destaque na página inicial. */
export type FreeLessonItem = {
  id: number;
  title: string;
  courseTitle: string;
  href: string;
};

/**
 * Até 4 aulas grátis publicadas, das disciplinas publicadas (ordem do catálogo).
 * @returns Aulas com o link para a página da aula.
 */
export const getFreeLessons = cache(async (): Promise<FreeLessonItem[]> => {
  const lessons = await prisma.lesson.findMany({
    where: {
      isPreview: true,
      status: "published",
      topic: { module: { status: "published", course: { status: "published" } } },
    },
    orderBy: [{ topic: { module: { course: { sortOrder: "asc" } } } }, { sortOrder: "asc" }],
    take: 4,
    select: {
      id: true,
      title: true,
      slug: true,
      topic: {
        select: {
          module: {
            select: { slug: true, course: { select: { slug: true, title: true } } },
          },
        },
      },
    },
  });
  return lessons.map((lesson) => {
    const { module } = lesson.topic;
    return {
      id: lesson.id,
      title: lesson.title,
      courseTitle: module.course.title,
      href: `/disciplina/${module.course.slug}/${module.slug}/${lesson.slug}`,
    };
  });
});

/**
 * Perfil resumido do professor (foto, nome, título, bio curta e números).
 * @returns Perfil e números de destaque.
 */
export const getProfessorSummary = cache(async () => {
  const [profile, highlights] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: 1 },
      select: {
        fullName: true,
        displayName: true,
        headline: true,
        shortBio: true,
        lattesUrl: true,
        photoUrl: true,
        photoFile: { select: { publicUrl: true } },
      },
    }),
    prisma.profileHighlight.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return { profile, highlights };
});

/**
 * Foto do professor: arquivo enviado no painel ou, sem ele, o link externo
 * (Drive vira a miniatura grande, que o navegador exibe como imagem).
 * @param profile Perfil com photoFile e photoUrl.
 * @returns Endereço da imagem ou null.
 */
export function profilePhotoUrl(
  profile: { photoUrl: string | null; photoFile: { publicUrl: string | null } | null } | null,
): string | null {
  return (
    profile?.photoFile?.publicUrl || (profile?.photoUrl ? imageUrl(profile.photoUrl) : null) || null
  );
}
