import type { Metadata } from "next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import { deleteCategory, deleteGroup, reorderCategories, reorderGroups } from "@/actions/catalog";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { GroupForm } from "@/components/forms/GroupForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemRow } from "@/components/ui/ItemRow";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";

export const metadata: Metadata = { title: "Categorias e grupos" };

/**
 * Seções do catálogo e os grupos de cada uma (Categoria → Grupo →
 * Disciplina), com arrastar para ordenar (RF25).
 */
export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      groups: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { courses: true } } },
      },
    },
  });
  const categoryOptions = categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));

  return (
    <>
      <PageHeader
        title="Categorias e grupos"
        description="Categoria → Grupo → Disciplina. A ordem aqui é a ordem do catálogo em /aulas."
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
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle>Categorias</CardTitle>
          <SortableList
            onReorder={reorderCategories}
            empty={<EmptyState>Nenhuma categoria.</EmptyState>}
            items={categories.map((c) => ({
              id: c.id,
              content: (
                <ItemRow
                  title={c.name}
                  detail={`/aulas/${c.slug} · ${c.groups.length} grupo(s)${c.description ? ` · ${c.description}` : ""}`}
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

        {categories.map((category) => (
          <Card key={category.id}>
            <CardTitle
              actions={
                <ModalTrigger
                  label={
                    <>
                      <Plus className="size-4" aria-hidden /> Novo grupo
                    </>
                  }
                  title={`Novo grupo em ${category.name}`}
                  variant="ghost"
                >
                  <GroupForm categories={categoryOptions} defaultCategoryId={category.id} />
                </ModalTrigger>
              }
            >
              Grupos de {category.name}
            </CardTitle>
            <SortableList
              onReorder={reorderGroups.bind(null, category.id)}
              empty={
                <EmptyState>
                  Nenhum grupo. Crie um (ex.: PSC (UFAM), ENEM, 1º ano) para cadastrar disciplinas.
                </EmptyState>
              }
              items={category.groups.map((g) => ({
                id: g.id,
                content: (
                  <ItemRow
                    title={g.name}
                    detail={`/aulas/${category.slug}/${g.slug} · ${g._count.courses} disciplina(s)${g.description ? ` · ${g.description}` : ""}`}
                    actions={
                      <>
                        <ModalTrigger
                          label={<Pencil className="size-4" aria-hidden />}
                          title="Editar grupo"
                          variant="ghost"
                          ariaLabel={`Editar ${g.name}`}
                        >
                          <GroupForm
                            categories={categoryOptions}
                            item={{
                              id: g.id,
                              categoryId: g.categoryId,
                              slug: g.slug,
                              name: g.name,
                              description: g.description ?? "",
                            }}
                          />
                        </ModalTrigger>
                        <ActionButton
                          action={deleteGroup.bind(null, g.id)}
                          confirm={`Remover o grupo "${g.name}"?`}
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
        ))}
      </div>
    </>
  );
}
