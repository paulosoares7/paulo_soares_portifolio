import type { Metadata } from "next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import { deleteResearchArea, reorderResearchAreas } from "@/actions/profile";
import { ResearchAreaForm } from "@/components/forms/ResearchAreaForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemRow } from "@/components/ui/ItemRow";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";

export const metadata: Metadata = { title: "Áreas de pesquisa" };

const edit = <Pencil className="size-4" aria-hidden />;
const add = (
  <>
    <Plus className="size-4" aria-hidden /> Adicionar
  </>
);
const trash = <Trash2 className="size-4" aria-hidden />;

/** Áreas de pesquisa do portfólio (RF23). */
export default async function ResearchAreasPage() {
  const areas = await prisma.researchArea.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <PageHeader
        title="Áreas de pesquisa"
        description="Aparecem na home e na página Sobre do portfólio. Arraste para mudar a ordem."
      />
      <Card>
        <CardTitle
          actions={
            <ModalTrigger label={add} title="Nova área de pesquisa">
              <ResearchAreaForm />
            </ModalTrigger>
          }
        >
          Áreas de pesquisa
        </CardTitle>
        <SortableList
          onReorder={reorderResearchAreas}
          empty={<EmptyState>Nenhuma área cadastrada.</EmptyState>}
          items={areas.map((a) => ({
            id: a.id,
            content: (
              <ItemRow
                title={a.name}
                detail={a.description}
                actions={
                  <>
                    <ModalTrigger
                      label={edit}
                      title="Editar área"
                      variant="ghost"
                      ariaLabel={`Editar ${a.name}`}
                    >
                      <ResearchAreaForm
                        item={{ id: a.id, name: a.name, description: a.description ?? "" }}
                      />
                    </ModalTrigger>
                    <ActionButton
                      action={deleteResearchArea.bind(null, a.id)}
                      confirm="Remover esta área?"
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
    </>
  );
}
