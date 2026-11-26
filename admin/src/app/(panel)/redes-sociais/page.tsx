import type { Metadata } from "next";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import {
  deleteSocialLink,
  reorderSocialLinks,
  toggleSocialLinkVisibility,
} from "@/actions/profile";
import { SocialLinkForm } from "@/components/forms/SocialLinkForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemRow } from "@/components/ui/ItemRow";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";
import { SOCIAL_NETWORKS } from "@/lib/labels";

export const metadata: Metadata = { title: "Redes sociais" };

const edit = <Pencil className="size-4" aria-hidden />;
const add = (
  <>
    <Plus className="size-4" aria-hidden /> Adicionar
  </>
);
const trash = <Trash2 className="size-4" aria-hidden />;
const eye = <Eye className="size-4" aria-hidden />;
const eyeOff = <EyeOff className="size-4" aria-hidden />;

/** Redes sociais do portfólio: ícones do rodapé e da página de contato. */
export default async function SocialLinksPage() {
  const socialLinks = await prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <PageHeader
        title="Redes sociais"
        description="Ícones do portfólio e da plataforma, na ordem desta lista (arraste para mudar). O olho mostra ou oculta."
      />
      <Card>
        <CardTitle
          actions={
            <ModalTrigger label={add} title="Nova rede social">
              <SocialLinkForm />
            </ModalTrigger>
          }
        >
          Redes sociais
        </CardTitle>
        <SortableList
          onReorder={reorderSocialLinks}
          empty={<EmptyState>Nenhuma rede cadastrada.</EmptyState>}
          items={socialLinks.map((s) => ({
            id: s.id,
            content: (
              <ItemRow
                title={SOCIAL_NETWORKS[s.network]}
                detail={s.url}
                badges={s.isVisible ? null : <Badge>oculta</Badge>}
                actions={
                  <>
                    <ActionButton
                      action={toggleSocialLinkVisibility.bind(null, s.id)}
                      title={s.isVisible ? "Ocultar no portfólio" : "Mostrar no portfólio"}
                    >
                      {s.isVisible ? eyeOff : eye}
                    </ActionButton>
                    <ModalTrigger
                      label={edit}
                      title="Editar rede social"
                      variant="ghost"
                      ariaLabel={`Editar ${SOCIAL_NETWORKS[s.network]}`}
                    >
                      <SocialLinkForm
                        item={{
                          id: s.id,
                          network: s.network,
                          label: s.label ?? "",
                          url: s.url,
                          isVisible: s.isVisible,
                        }}
                      />
                    </ModalTrigger>
                    <ActionButton
                      action={deleteSocialLink.bind(null, s.id)}
                      confirm="Remover este link?"
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
