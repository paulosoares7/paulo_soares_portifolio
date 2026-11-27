import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FolderPlus, Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import {
  deleteCourse,
  deleteLesson,
  deleteModule,
  deleteTopic,
  reorderLessons,
  reorderModules,
  reorderTopics,
} from "@/actions/catalog";
import { CourseCoverForm } from "@/components/forms/CourseCoverForm";
import { CourseForm } from "@/components/forms/CourseForm";
import { LessonForm } from "@/components/forms/LessonForm";
import { ModuleForm } from "@/components/forms/ModuleForm";
import { TopicForm } from "@/components/forms/TopicForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ItemRow } from "@/components/ui/ItemRow";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { SortableList } from "@/components/ui/SortableList";
import { CONTENT_STATUSES, VIDEO_PROVIDERS } from "@/lib/labels";
import { createReadUrl, isStorageConfigured } from "@/lib/storage";
import { loadVideoOptions } from "@/lib/video-options";

export const metadata: Metadata = { title: "Disciplina" };

const pencil = <Pencil className="size-4" aria-hidden />;
const trash = <Trash2 className="size-4" aria-hidden />;

/** Disciplina: dados + árvore módulo → tema → aula com arrastar para ordenar (RF25). */
export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [course, categories, videos] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        coverFile: true,
        group: { select: { name: true, category: { select: { name: true } } } },
        modules: {
          orderBy: { sortOrder: "asc" },
          include: {
            topics: {
              orderBy: { sortOrder: "asc" },
              include: {
                lessons: {
                  orderBy: { sortOrder: "asc" },
                  include: { video: { select: { provider: true, status: true } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        groups: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true } },
      },
    }),
    loadVideoOptions(),
  ]);
  if (!course) notFound();

  const storageReady = isStorageConfigured();
  const coverUrl = course.coverFile
    ? (course.coverFile.publicUrl ??
      (storageReady ? await createReadUrl(course.coverFile.storageKey) : null))
    : null;
  const allLessons = course.modules.flatMap((m) => m.topics.flatMap((t) => t.lessons));
  const freeLessons = allLessons.filter((l) => l.isPreview).length;

  return (
    <>
      <PageHeader
        title={course.title}
        back={{ href: "/disciplinas", label: "Disciplinas" }}
        description={`${course.group.category.name} › ${course.group.name} · ${course.modules.length} módulo(s) · ${allLessons.length} aula(s) · ${freeLessons}${course.maxFreeLessons === null ? "" : `/${course.maxFreeLessons}`} aulas grátis${course.maxFreeLessons === null ? " (sem limite)" : ""}`}
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle
            actions={
              <ModalTrigger
                label={
                  <>
                    <FolderPlus className="size-4" aria-hidden /> Novo módulo
                  </>
                }
                title="Novo módulo"
                variant="primary"
              >
                <ModuleForm courseId={course.id} />
              </ModalTrigger>
            }
          >
            Estrutura
          </CardTitle>
          <SortableList
            onReorder={reorderModules.bind(null, course.id)}
            empty={
              <EmptyState>Nenhum módulo ainda. Comece por &quot;Novo módulo&quot;.</EmptyState>
            }
            items={course.modules.map((mod) => ({
              id: mod.id,
              content: (
                <div className="flex flex-col gap-3 py-1">
                  <ItemRow
                    title={<span className="text-base">{mod.title}</span>}
                    detail={`/${mod.slug} · ${mod.topics.length} tema(s)`}
                    badges={mod.status === "draft" ? <Badge>rascunho</Badge> : null}
                    actions={
                      <>
                        <ModalTrigger
                          label={
                            <>
                              <Plus className="size-4" aria-hidden /> Tema
                            </>
                          }
                          title={`Novo tema em ${mod.title}`}
                          variant="ghost"
                        >
                          <TopicForm moduleId={mod.id} />
                        </ModalTrigger>
                        <ModalTrigger
                          label={pencil}
                          title="Editar módulo"
                          variant="ghost"
                          ariaLabel={`Editar módulo ${mod.title}`}
                        >
                          <ModuleForm
                            courseId={course.id}
                            item={{
                              id: mod.id,
                              slug: mod.slug,
                              title: mod.title,
                              description: mod.description ?? "",
                              status: mod.status,
                            }}
                          />
                        </ModalTrigger>
                        <ActionButton
                          action={deleteModule.bind(null, mod.id)}
                          confirm={`Apagar o módulo "${mod.title}" com todos os temas e aulas?`}
                          title={`Remover módulo ${mod.title}`}
                        >
                          {trash}
                        </ActionButton>
                      </>
                    }
                  />
                  <div className="border-border ml-2 border-l pl-3">
                    <SortableList
                      onReorder={reorderTopics.bind(null, mod.id)}
                      empty={<p className="text-muted text-xs">Sem temas.</p>}
                      items={mod.topics.map((topic) => ({
                        id: topic.id,
                        content: (
                          <div className="flex flex-col gap-2">
                            <ItemRow
                              title={topic.title}
                              detail={`${topic.lessons.length} aula(s)`}
                              actions={
                                <>
                                  <ModalTrigger
                                    label={
                                      <>
                                        <Plus className="size-4" aria-hidden /> Aula
                                      </>
                                    }
                                    title={`Nova aula em ${topic.title}`}
                                    variant="ghost"
                                    wide
                                  >
                                    <LessonForm topicId={topic.id} videos={videos} compact />
                                  </ModalTrigger>
                                  <ModalTrigger
                                    label={pencil}
                                    title="Editar tema"
                                    variant="ghost"
                                    ariaLabel={`Editar tema ${topic.title}`}
                                  >
                                    <TopicForm
                                      moduleId={mod.id}
                                      item={{
                                        id: topic.id,
                                        title: topic.title,
                                        description: topic.description ?? "",
                                      }}
                                    />
                                  </ModalTrigger>
                                  <ActionButton
                                    action={deleteTopic.bind(null, topic.id)}
                                    confirm={`Apagar o tema "${topic.title}" e suas aulas?`}
                                    title={`Remover tema ${topic.title}`}
                                  >
                                    {trash}
                                  </ActionButton>
                                </>
                              }
                            />
                            <SortableList
                              onReorder={reorderLessons.bind(null, topic.id)}
                              empty={<p className="text-muted text-xs">Sem aulas.</p>}
                              items={topic.lessons.map((lesson) => ({
                                id: lesson.id,
                                content: (
                                  <ItemRow
                                    title={lesson.title}
                                    detail={
                                      lesson.video
                                        ? `Vídeo: ${VIDEO_PROVIDERS[lesson.video.provider]}`
                                        : "Vídeo em breve"
                                    }
                                    badges={
                                      <>
                                        {lesson.isPreview ? (
                                          <Badge tone="success">grátis</Badge>
                                        ) : null}
                                        {lesson.status === "draft" ? (
                                          <Badge>{CONTENT_STATUSES.draft}</Badge>
                                        ) : null}
                                        {lesson.video ? null : (
                                          <Badge tone="warning">em breve</Badge>
                                        )}
                                      </>
                                    }
                                    actions={
                                      <>
                                        <ButtonLink
                                          href={`/disciplinas/${course.id}/aulas/${lesson.id}`}
                                          variant="ghost"
                                          size="sm"
                                          aria-label={`Editar aula ${lesson.title}`}
                                        >
                                          {pencil}
                                        </ButtonLink>
                                        <ActionButton
                                          action={deleteLesson.bind(null, lesson.id)}
                                          confirm={`Apagar a aula "${lesson.title}"? O progresso dos alunos nela também é apagado.`}
                                          title={`Remover aula ${lesson.title}`}
                                        >
                                          {trash}
                                        </ActionButton>
                                      </>
                                    }
                                  />
                                ),
                              }))}
                            />
                          </div>
                        ),
                      }))}
                    />
                  </div>
                </div>
              ),
            }))}
          />
        </Card>

        <Card>
          <CardTitle>Dados da disciplina</CardTitle>
          <CourseForm
            categories={categories}
            item={{
              id: course.id,
              groupId: course.groupId,
              slug: course.slug,
              title: course.title,
              shortDescription: course.shortDescription,
              description: course.description ?? "",
              icon: course.icon ?? "",
              color: course.color ?? "",
              status: course.status,
              maxFreeLessons: course.maxFreeLessons?.toString() ?? "",
              maxFreeActivities: course.maxFreeActivities?.toString() ?? "",
            }}
          />
        </Card>

        <Card>
          <CardTitle>Capa</CardTitle>
          <CourseCoverForm
            courseId={course.id}
            storageReady={storageReady}
            cover={course.coverFile ? { name: course.coverFile.originalName, url: coverUrl } : null}
          />
        </Card>

        <Card className="border-danger/40">
          <CardTitle>Apagar disciplina</CardTitle>
          <p className="text-muted mb-3 text-sm">
            Só é possível apagar disciplinas que nunca estiveram numa assinatura. Para tirar do
            site, mude o status para &quot;Arquivada&quot;.
          </p>
          <ActionButton
            action={deleteCourse.bind(null, course.id)}
            confirm={`Apagar "${course.title}" com todos os módulos, temas e aulas? Não dá para desfazer.`}
            variant="danger"
            size="md"
          >
            {trash} Apagar disciplina
          </ActionButton>
        </Card>
      </div>
    </>
  );
}
