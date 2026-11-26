import type { Metadata } from "next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import {
  deleteDegree,
  deleteExperience,
  reorderDegrees,
  reorderExperiences,
} from "@/actions/profile";
import { DegreeForm } from "@/components/forms/DegreeForm";
import { ExperienceForm } from "@/components/forms/ExperienceForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemRow } from "@/components/ui/ItemRow";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";
import { dateToInput, formatDate } from "@/lib/format";
import { DEGREE_LEVELS, DEGREE_STATUSES } from "@/lib/labels";

export const metadata: Metadata = { title: "Formação e atuação" };

const edit = <Pencil className="size-4" aria-hidden />;
const add = (
  <>
    <Plus className="size-4" aria-hidden /> Adicionar
  </>
);
const trash = <Trash2 className="size-4" aria-hidden />;

/** Formação acadêmica e atuação profissional do portfólio (RF23). */
export default async function CareerPage() {
  const [degrees, experiences] = await Promise.all([
    prisma.academicDegree.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.experience.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="Formação e atuação"
        description="Aparecem na página Sobre do portfólio. Arraste para mudar a ordem."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardTitle
            actions={
              <ModalTrigger label={add} title="Nova formação" wide>
                <DegreeForm />
              </ModalTrigger>
            }
          >
            Formação
          </CardTitle>
          <SortableList
            onReorder={reorderDegrees}
            empty={<EmptyState>Nenhuma formação cadastrada.</EmptyState>}
            items={degrees.map((d) => ({
              id: d.id,
              content: (
                <ItemRow
                  title={d.course}
                  detail={`${DEGREE_LEVELS[d.level]} · ${d.institution} · ${d.startYear ?? "?"}–${d.endYear ?? "atual"}`}
                  badges={
                    <>
                      {d.status !== "completed" ? (
                        <Badge tone="warning">{DEGREE_STATUSES[d.status]}</Badge>
                      ) : null}
                      {d.source === "lattes" ? <Badge tone="accent">Lattes</Badge> : null}
                    </>
                  }
                  actions={
                    <>
                      <ModalTrigger
                        label={edit}
                        title="Editar formação"
                        variant="ghost"
                        wide
                        ariaLabel={`Editar ${d.course}`}
                      >
                        <DegreeForm
                          item={{
                            id: d.id,
                            level: d.level,
                            course: d.course,
                            institution: d.institution,
                            startYear: d.startYear?.toString() ?? "",
                            endYear: d.endYear?.toString() ?? "",
                            status: d.status,
                            thesisTitle: d.thesisTitle ?? "",
                            advisor: d.advisor ?? "",
                          }}
                        />
                      </ModalTrigger>
                      <ActionButton
                        action={deleteDegree.bind(null, d.id)}
                        confirm="Remover esta formação?"
                        title="Remover"
                      >
                        {trash}
                      </ActionButton>
                    </>
                  }
                />
              ),
            }))}
          />
        </Card>

        <Card>
          <CardTitle
            actions={
              <ModalTrigger label={add} title="Nova atuação" wide>
                <ExperienceForm />
              </ModalTrigger>
            }
          >
            Atuação profissional
          </CardTitle>
          <SortableList
            onReorder={reorderExperiences}
            empty={<EmptyState>Nenhuma atuação cadastrada.</EmptyState>}
            items={experiences.map((e) => ({
              id: e.id,
              content: (
                <ItemRow
                  title={e.role}
                  detail={`${e.institution} · ${e.startDate ? `${formatDate(e.startDate)} a ` : ""}${e.endDate ? formatDate(e.endDate) : "atual"}`}
                  actions={
                    <>
                      <ModalTrigger
                        label={edit}
                        title="Editar atuação"
                        variant="ghost"
                        wide
                        ariaLabel={`Editar ${e.role}`}
                      >
                        <ExperienceForm
                          item={{
                            id: e.id,
                            institution: e.institution,
                            role: e.role,
                            description: e.description ?? "",
                            startDate: dateToInput(e.startDate),
                            endDate: dateToInput(e.endDate),
                          }}
                        />
                      </ModalTrigger>
                      <ActionButton
                        action={deleteExperience.bind(null, e.id)}
                        confirm="Remover esta atuação?"
                        title="Remover"
                      >
                        {trash}
                      </ActionButton>
                    </>
                  }
                />
              ),
            }))}
          />
        </Card>
      </div>
    </>
  );
}
