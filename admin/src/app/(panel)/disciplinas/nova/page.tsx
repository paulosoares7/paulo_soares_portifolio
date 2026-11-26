import type { Metadata } from "next";
import { prisma } from "@portfolio/database";
import { CourseForm } from "@/components/forms/CourseForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Nova disciplina" };

/** Cadastro de disciplina. Depois de criar, abre a página para montar os módulos. */
export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ grupo?: string }>;
}) {
  const { grupo } = await searchParams;
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      groups: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
    },
  });

  return (
    <>
      <PageHeader title="Nova disciplina" back={{ href: "/disciplinas", label: "Disciplinas" }} />
      <Card>
        <CourseForm categories={categories} defaultGroupId={Number(grupo) || undefined} />
      </Card>
    </>
  );
}
