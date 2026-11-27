import type { Metadata } from "next";
import { ExternalLink, FileText, Gift, Link2, Pencil, Plus, Trash2 } from "lucide-react";
import { prisma } from "@portfolio/database";
import { LINK_SOURCE_LABELS, linkSource } from "@portfolio/database/external-link";
import { deleteMaterial, toggleMaterialPreview } from "@/actions/materials";
import { MaterialForm } from "@/components/forms/MaterialForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { ModalTrigger } from "@/components/ui/ModalTrigger";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Td, Th } from "@/components/ui/Table";
import { loadCourseTree } from "@/lib/course-tree";
import { MATERIAL_TYPES } from "@/lib/labels";
import { createReadUrl, isStorageConfigured } from "@/lib/storage";

export const metadata: Metadata = { title: "Materiais" };

/** Materiais: PDF enviado ou link, por disciplina, módulo ou aula; marcação de grátis (RF27). */
export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ disciplina?: string }>;
}) {
  const courseFilter = Number((await searchParams).disciplina) || null;
  const [tree, materials] = await Promise.all([
    loadCourseTree(),
    prisma.material.findMany({
      where: courseFilter
        ? {
            OR: [
              { courseId: courseFilter },
              { module: { courseId: courseFilter } },
              { lesson: { topic: { module: { courseId: courseFilter } } } },
            ],
          }
        : undefined,
      orderBy: [{ createdAt: "desc" }],
      include: {
        file: true,
        course: { select: { id: true, title: true } },
        module: {
          select: { id: true, title: true, course: { select: { id: true, title: true } } },
        },
        lesson: {
          select: {
            id: true,
            title: true,
            topic: {
              select: {
                module: {
                  select: { id: true, title: true, course: { select: { id: true, title: true } } },
                },
              },
            },
          },
        },
      },
    }),
  ]);
  const storageReady = isStorageConfigured();

  const rows = await Promise.all(
    materials.map(async (m) => {
      const lessonModule = m.lesson?.topic.module;
      const course = m.course ?? m.module?.course ?? lessonModule?.course;
      const owner = m.course
        ? "Disciplina inteira"
        : m.module
          ? `Módulo: ${m.module.title}`
          : `Aula: ${lessonModule?.title} › ${m.lesson?.title}`;
      // Admin pode abrir o PDF por URL assinada curta (5 min).
      const openUrl = m.file
        ? storageReady
          ? await createReadUrl(m.file.storageKey)
          : null
        : m.externalUrl;
      return { m, course, owner, openUrl, lessonModuleId: lessonModule?.id ?? null };
    }),
  );

  return (
    <>
      <PageHeader
        title="Materiais"
        description="Notas de aula, listas, formulários e links. PDF fica privado e só é visualizado no site."
        actions={
          <ModalTrigger
            label={
              <>
                <Plus className="size-4" aria-hidden /> Novo material
              </>
            }
            title="Novo material"
            variant="primary"
            size="md"
            wide
          >
            <MaterialForm
              tree={tree}
              storageReady={storageReady}
              defaultCourseId={courseFilter ?? undefined}
            />
          </ModalTrigger>
        }
      />
      <form className="mb-4 flex flex-wrap items-center gap-3">
        <Select
          name="disciplina"
          defaultValue={courseFilter ?? ""}
          aria-label="Filtrar por disciplina"
          className="max-w-xs"
        >
          <option value="">Todas as disciplinas</option>
          {tree.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonClasses("secondary")}>
          Filtrar
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState>Nenhum material.</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Material</Th>
              <Th>Onde aparece</Th>
              <Th>Acesso</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, course, owner, openUrl, lessonModuleId }) => (
              <tr key={m.id}>
                <Td>
                  <div className="flex items-start gap-3">
                    {/* Ícone diz a forma: arquivo enviado (protegido) ou link externo. */}
                    <span
                      role="img"
                      aria-label={m.file ? "Arquivo enviado" : "Link externo"}
                      title={m.file ? "Arquivo enviado" : "Link externo"}
                      className={`rounded-btn mt-0.5 flex size-8 shrink-0 items-center justify-center ${
                        m.file ? "bg-accent/15 text-accent" : "bg-warning/15 text-warning"
                      }`}
                    >
                      {m.file ? (
                        <FileText className="size-4" aria-hidden />
                      ) : (
                        <Link2 className="size-4" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">{m.title}</p>
                      <p className="text-muted text-xs">
                        {MATERIAL_TYPES[m.type]} ·{" "}
                        {m.file
                          ? `Arquivo: ${m.file.originalName}`
                          : `Link: ${m.externalUrl ? LINK_SOURCE_LABELS[linkSource(m.externalUrl)] : "—"}`}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <p>{course?.title}</p>
                  <p className="text-muted text-xs">{owner}</p>
                </Td>
                <Td>
                  {m.isPreview ? <Badge tone="success">grátis</Badge> : <Badge>assinantes</Badge>}
                </Td>
                <Td>
                  <div className="flex justify-end gap-1">
                    {openUrl ? (
                      <a
                        href={openUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonClasses("ghost", "sm")}
                        aria-label={`Abrir ${m.title}`}
                        title="Abrir"
                      >
                        <ExternalLink className="size-4" aria-hidden />
                      </a>
                    ) : null}
                    <ActionButton
                      action={toggleMaterialPreview.bind(null, m.id, !m.isPreview)}
                      title={m.isPreview ? "Tornar só para assinantes" : "Tornar grátis"}
                    >
                      <Gift className={`size-4 ${m.isPreview ? "text-success" : ""}`} aria-hidden />
                    </ActionButton>
                    <ModalTrigger
                      label={<Pencil className="size-4" aria-hidden />}
                      title="Editar material"
                      variant="ghost"
                      wide
                      ariaLabel={`Editar ${m.title}`}
                    >
                      <MaterialForm
                        tree={tree}
                        storageReady={storageReady}
                        item={{
                          id: m.id,
                          ownerType: m.courseId ? "course" : m.moduleId ? "module" : "lesson",
                          courseId: course?.id ?? 0,
                          moduleId: m.moduleId ?? lessonModuleId,
                          lessonId: m.lessonId,
                          type: m.type,
                          title: m.title,
                          description: m.description ?? "",
                          fileId: m.fileId,
                          fileName: m.file?.originalName ?? null,
                          externalUrl: m.externalUrl ?? "",
                          isPreview: m.isPreview,
                        }}
                      />
                    </ModalTrigger>
                    <ActionButton
                      action={deleteMaterial.bind(null, m.id)}
                      confirm={`Remover "${m.title}"?`}
                      title="Remover"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </ActionButton>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
