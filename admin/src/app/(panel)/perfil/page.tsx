import type { Metadata } from "next";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import {
  deleteDegree,
  deleteExperience,
  deleteHighlight,
  deleteResearchArea,
  deleteSocialLink,
  reorderDegrees,
  reorderExperiences,
  reorderHighlights,
  reorderResearchAreas,
  reorderSocialLinks,
} from "@/actions/profile";
import { DegreeForm } from "@/components/forms/DegreeForm";
import { ExperienceForm } from "@/components/forms/ExperienceForm";
import { HighlightForm } from "@/components/forms/HighlightForm";
import { ProfileFilesForm } from "@/components/forms/ProfileFilesForm";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { ResearchAreaForm } from "@/components/forms/ResearchAreaForm";
import { SocialLinkForm } from "@/components/forms/SocialLinkForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemRow } from "@/components/ui/ItemRow";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";
import { dateToInput, formatDate } from "@/lib/format";
import { DEGREE_LEVELS, DEGREE_STATUSES, SOCIAL_NETWORKS } from "@/lib/labels";
import { createReadUrl, isStorageConfigured } from "@/lib/storage";

export const metadata: Metadata = { title: "Perfil" };

const edit = <Pencil className="size-4" aria-hidden />;
const add = (
  <>
    <Plus className="size-4" aria-hidden /> Adicionar
  </>
);
const trash = <Trash2 className="size-4" aria-hidden />;

/** Perfil e portfólio (RF23). */
export default async function ProfilePage() {
  const [profile, highlights, socialLinks, degrees, experiences, areas] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 }, include: { photoFile: true, cvFile: true } }),
    prisma.profileHighlight.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.socialLink.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.academicDegree.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.experience.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.researchArea.findMany({ orderBy: { sortOrder: "asc" } }),
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
        description="Dados que aparecem na home e na página Sobre do site."
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
          />
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
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

          <Card className="xl:col-span-2">
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
        </div>
      </div>
    </>
  );
}
