import type { Metadata } from "next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import { deleteHighlight, reorderHighlights } from "@/actions/profile";
import { HighlightForm } from "@/components/forms/HighlightForm";
import { ProfileFilesForm } from "@/components/forms/ProfileFilesForm";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemRow } from "@/components/ui/ItemRow";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";
import { formatDate } from "@/lib/format";
import { createReadUrl, isStorageConfigured } from "@/lib/storage";

export const metadata: Metadata = { title: "Perfil" };

const edit = <Pencil className="size-4" aria-hidden />;
const add = (
  <>
    <Plus className="size-4" aria-hidden /> Adicionar
  </>
);
const trash = <Trash2 className="size-4" aria-hidden />;

/** Perfil do portfólio (RF23): dados, foto, currículo e números de destaque. */
export default async function ProfilePage() {
  const [profile, highlights] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 }, include: { photoFile: true, cvFile: true } }),
    prisma.profileHighlight.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const storageReady = isStorageConfigured();
  const photoUrl = profile?.photoFile
    ? (profile.photoFile.publicUrl ??
      (storageReady ? await createReadUrl(profile.photoFile.storageKey) : null))
    : null;

  return (
    <>
      <PageHeader
        title="Perfil"
        description="Dados que aparecem na home e na página Sobre do portfólio e no resumo da plataforma."
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle>Dados</CardTitle>
          <ProfileForm
            values={{
              fullName: profile?.fullName ?? "",
              displayName: profile?.displayName ?? "",
              headline: profile?.headline ?? "",
              shortBio: profile?.shortBio ?? "",
              longBio: profile?.longBio ?? "",
              publicEmail: profile?.publicEmail ?? "",
              city: profile?.city ?? "",
              lattesId: profile?.lattesId ?? "",
              lattesUrl: profile?.lattesUrl ?? "",
              orcidId: profile?.orcidId ?? "",
              scholarUrl: profile?.scholarUrl ?? "",
            }}
          />
          {profile?.lattesUpdatedAt ? (
            <p className="text-muted mt-2 text-xs">
              Lattes atualizado em {formatDate(profile.lattesUpdatedAt)} (lido do XML).
            </p>
          ) : null}
        </Card>

        <Card>
          <CardTitle>Foto e currículo</CardTitle>
          <ProfileFilesForm
            storageReady={storageReady}
            photo={
              profile?.photoFile ? { name: profile.photoFile.originalName, url: photoUrl } : null
            }
            cv={profile?.cvFile ? { name: profile.cvFile.originalName, url: null } : null}
            photoLink={profile?.photoUrl ?? ""}
            cvLink={profile?.cvUrl ?? ""}
          />
        </Card>

        <Card>
          <CardTitle
            actions={
              <ModalTrigger label={add} title="Novo número">
                <HighlightForm />
              </ModalTrigger>
            }
          >
            Números de destaque
          </CardTitle>
          <SortableList
            onReorder={reorderHighlights}
            empty={<EmptyState>Nenhum número cadastrado.</EmptyState>}
            items={highlights.map((h) => ({
              id: h.id,
              content: (
                <ItemRow
                  title={
                    <>
                      <span className="text-accent">{h.value}</span> {h.label}
                    </>
                  }
                  actions={
                    <>
                      <ModalTrigger
                        label={edit}
                        title="Editar número"
                        variant="ghost"
                        ariaLabel={`Editar ${h.label}`}
                      >
                        <HighlightForm item={{ id: h.id, value: h.value, label: h.label }} />
                      </ModalTrigger>
                      <ActionButton
                        action={deleteHighlight.bind(null, h.id)}
                        confirm="Remover este número?"
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
