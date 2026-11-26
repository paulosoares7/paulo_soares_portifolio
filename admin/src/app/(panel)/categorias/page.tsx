import type { Metadata } from "next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import { deleteCategory, reorderCategories } from "@/actions/catalog";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemRow } from "@/components/ui/ItemRow";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";

export const metadata: Metadata = { title: "Categorias" };

/** Seções do catálogo, com arrastar para ordenar (RF25). */
export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { courses: true } } },
  });

  return (
    <>
      <PageHeader
        title="Categorias"
        description="Seções do catálogo do site. A ordem aqui é a ordem das abas em /aulas."
        actions={
          <ModalTrigger
            label={
              <>
                <Plus className="size-4" aria-hidden /> Nova categoria
              </>
            }
            title="Nova categoria"
            variant="primary"
            size="md"
          >
            <CategoryForm />
          </ModalTrigger>
        }
      />
      <Card>
        <SortableList
          onReorder={reorderCategories}
          empty={<EmptyState>Nenhuma categoria.</EmptyState>}
          items={categories.map((c) => ({
            id: c.id,
            content: (
              <ItemRow
                title={c.name}
                detail={`/aulas/${c.slug} · ${c._count.courses} disciplina(s)${c.description ? ` · ${c.description}` : ""}`}
                actions={
                  <>
                    <ModalTrigger
                      label={<Pencil className="size-4" aria-hidden />}
                      title="Editar categoria"
                      variant="ghost"
                      ariaLabel={`Editar ${c.name}`}
                    >
                      <CategoryForm
                        item={{
                          id: c.id,
                          slug: c.slug,
                          name: c.name,
                          description: c.description ?? "",
                        }}
                      />
                    </ModalTrigger>
                    <ActionButton
                      action={deleteCategory.bind(null, c.id)}
                      confirm={`Remover a categoria "${c.name}"?`}
                      title="Remover"
                    >
                      <Trash2 className="size-4" aria-hidden />
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
