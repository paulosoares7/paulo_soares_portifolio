import type { Metadata } from "next";
import { ActivityForm } from "@/components/forms/ActivityForm";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadCourseTree } from "@/lib/course-tree";

export const metadata: Metadata = { title: "Nova atividade" };

/** Cadastro de atividade; depois de criar, abre a página para as questões. */
export default async function NewActivityPage() {
  const tree = await loadCourseTree();
  return (
    <>
      <PageHeader title="Nova atividade" back={{ href: "/atividades", label: "Atividades" }} />
      <Card>
        <ActivityForm tree={tree} />
      </Card>
    </>
  );
}
