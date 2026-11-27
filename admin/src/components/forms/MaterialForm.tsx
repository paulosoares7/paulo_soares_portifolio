"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { saveMaterial } from "@/actions/materials";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ExternalLinkField } from "@/components/ui/ExternalLinkField";
import { FileUpload } from "@/components/ui/FileUpload";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { SourceTabs, type SourceMode } from "@/components/ui/SourceTabs";
import { MATERIAL_TYPES } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import type { CourseTree } from "@/types/catalog";
import { materialSchema } from "@/validators/media";

/** Valores de um material para edição. */
export type MaterialValues = {
  id: number;
  ownerType: "course" | "module" | "lesson";
  courseId: number;
  moduleId: number | null;
  lessonId: number | null;
  type: string;
  title: string;
  description: string;
  fileId: number | null;
  fileName: string | null;
  externalUrl: string;
  isPreview: boolean;
};

type MaterialFormProps = {
  item?: MaterialValues;
  tree: CourseTree[];
  storageReady: boolean;
  defaultCourseId?: number;
};

/**
 * Material da disciplina, de um módulo ou de uma aula, por uma de duas
 * formas: "Enviar arquivo" (PDF no storage, privado, visualizado no site com
 * marca d'água) ou "Colar link externo" (Drive, OneDrive, Dropbox ou site).
 */
export function MaterialForm({ item, tree, storageReady, defaultCourseId }: MaterialFormProps) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(materialSchema, saveMaterial, {
    onSuccess: close,
  });

  const [ownerType, setOwnerType] = useState(item?.ownerType ?? "course");
  const [courseId, setCourseId] = useState(item?.courseId ?? defaultCourseId ?? tree[0]?.id ?? 0);
  const [moduleId, setModuleId] = useState(item?.moduleId ?? 0);
  const [file, setFile] = useState<{ id: number; name: string } | null>(
    item?.fileId ? { id: item.fileId, name: item.fileName ?? "arquivo.pdf" } : null,
  );

  // Começa na forma que o material já usa; material novo começa no envio
  // (ou no link, se o storage não estiver configurado).
  const [mode, setMode] = useState<SourceMode>(
    item?.fileId ? "file" : item?.externalUrl ? "link" : storageReady ? "file" : "link",
  );

  const course = tree.find((c) => c.id === courseId);
  const lessons =
    ownerType === "lesson" ? (course?.modules.find((m) => m.id === moduleId)?.lessons ?? []) : [];

  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      {/* Só a forma escolhida vai no envio; a outra fica vazia. */}
      <input type="hidden" name="fileId" value={mode === "file" ? (file?.id ?? "") : ""} />

      <Field label="Onde aparece" htmlFor="mat-owner" error={errors.ownerType}>
        <Select
          id="mat-owner"
          name="ownerType"
          value={ownerType}
          onChange={(e) => setOwnerType(e.target.value as typeof ownerType)}
        >
          <option value="course">Disciplina inteira</option>
          <option value="module">Um módulo</option>
          <option value="lesson">Uma aula</option>
        </Select>
      </Field>
      <Field label="Disciplina" htmlFor="mat-course" error={errors.courseId}>
        <Select
          id="mat-course"
          name="courseId"
          value={courseId}
          onChange={(e) => {
            setCourseId(Number(e.target.value));
            setModuleId(0);
          }}
        >
          {tree.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </Select>
      </Field>
      {ownerType !== "course" ? (
        <Field label="Módulo" htmlFor="mat-module" error={errors.moduleId}>
          <Select
            id="mat-module"
            name="moduleId"
            value={moduleId || ""}
            onChange={(e) => setModuleId(Number(e.target.value))}
            invalid={!!errors.moduleId}
          >
            <option value="" disabled>
              Escolha...
            </option>
            {course?.modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}
      {ownerType === "lesson" ? (
        <Field label="Aula" htmlFor="mat-lesson" error={errors.lessonId}>
          <Select
            id="mat-lesson"
            name="lessonId"
            defaultValue={item?.lessonId ?? ""}
            key={moduleId}
            invalid={!!errors.lessonId}
          >
            <option value="" disabled>
              Escolha...
            </option>
            {lessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <Field label="Tipo" htmlFor="mat-type" error={errors.type}>
        <Select id="mat-type" name="type" defaultValue={item?.type ?? "lecture_notes"}>
          {Object.entries(MATERIAL_TYPES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Título" htmlFor="mat-title" error={errors.title}>
        <Input id="mat-title" name="title" defaultValue={item?.title} invalid={!!errors.title} />
      </Field>
      <Field
        label="Descrição (opcional)"
        htmlFor="mat-desc"
        error={errors.description}
        className="md:col-span-2"
      >
        <Textarea
          id="mat-desc"
          name="description"
          defaultValue={item?.description}
          maxLength={400}
          className="min-h-16"
        />
      </Field>

      <div className="flex flex-col gap-3 md:col-span-2">
        <span className="text-sm font-medium">Conteúdo</span>
        <SourceTabs mode={mode} onChange={setMode} label="Forma de adicionar o material" />
        {mode === "file" ? (
          <div className="flex flex-col gap-2">
            {file ? (
              <p className="flex items-center gap-2 text-sm">
                <FileText className="text-accent size-4" aria-hidden /> {file.name}
                <button
                  type="button"
                  className="text-danger text-xs hover:underline"
                  onClick={() => setFile(null)}
                >
                  remover
                </button>
              </p>
            ) : null}
            <FileUpload
              kind="material"
              storageReady={storageReady}
              label={file ? "Trocar PDF" : "Enviar PDF"}
              onUploaded={(mediaFileId, name) => setFile({ id: mediaFileId, name })}
            />
            {errors.externalUrl ? (
              <p className="text-danger text-xs">{errors.externalUrl[0]}</p>
            ) : null}
          </div>
        ) : (
          <ExternalLinkField
            id="mat-url"
            name="externalUrl"
            defaultValue={item?.externalUrl}
            error={errors.externalUrl}
            protectionWarning
          />
        )}
      </div>
      <div className="md:col-span-2">
        <Checkbox
          name="isPreview"
          defaultChecked={item?.isPreview ?? false}
          label="Grátis (visível sem login)"
        />
      </div>
      <p className="text-muted text-xs md:col-span-2">
        PDFs nunca são baixáveis: o site mostra só no visualizador, com marca d&apos;água.
      </p>
      <div className="md:col-span-2">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
