import type { Metadata } from "next";
import { prisma } from "@portfolio/database";
import { AnnouncementForm } from "@/components/forms/AnnouncementForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Novo aviso" };

/** Publicar aviso do professor (feed da disciplina, com reações no site). */
export default async function NewAnnouncementPage() {
  const courses = await prisma.course.findMany({
    where: { status: { not: "archived" } },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    select: { id: true, title: true },
  });
  return (
    <>
      <PageHeader
        title="Novo aviso"
        back={{ href: "/forum", label: "Fórum" }}
        description="Avisos entram visíveis; visitantes também leem."
      />
      <Card>
        <AnnouncementForm courses={courses} />
      </Card>
    </>
  );
}
