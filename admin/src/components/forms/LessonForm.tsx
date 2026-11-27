"use client";

import { saveLesson } from "@/actions/catalog";
import { TitleSlugFields } from "@/components/forms/TitleSlugFields";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { CONTENT_STATUSES } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import { lessonSchema } from "@/validators/catalog";

/** Valores de uma aula para edição. */
export type LessonValues = {
  id: number;
  topicId: number;
  videoId: number | null;
  slug: string;
  title: string;
  summary: string;
  content: string;
  isPreview: boolean;
  status: string;
};

type Option = { id: number; label: string };

type LessonFormProps = {
  item?: LessonValues;
  /** Tema da aula nova (criação rápida). */
  topicId?: number;
  /** Temas da disciplina, para mover a aula (só na edição completa). */
  topics?: Option[];
  videos: Option[];
  /** Criação rápida no modal: sem texto de apoio. */
  compact?: boolean;
};

/** Aula: título, endereço, vídeo, resumo, texto de apoio, grátis e status. */
export function LessonForm({ item, topicId, topics, videos, compact = false }: LessonFormProps) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(lessonSchema, saveLesson, {
    onSuccess: compact ? close : undefined,
  });

  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      {topics ? (
        <Field
          label="Tema"
          htmlFor="lesson-topic"
          error={errors.topicId}
          className="md:col-span-2"
          hint="Trocar o tema move a aula."
        >
          <Select id="lesson-topic" name="topicId" defaultValue={item?.topicId}>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
      ) : (
        <input type="hidden" name="topicId" value={item?.topicId ?? topicId ?? ""} />
      )}
      <TitleSlugFields
        prefix="lesson"
        titleLabel="Título da aula"
        defaultTitle={item?.title}
        defaultSlug={item?.slug}
        errors={errors}
        slugHint="Único dentro do módulo."
      />
      <Field
        label="Vídeo"
        htmlFor="lesson-video"
        error={errors.videoId}
        hint='Sem vídeo = selo "vídeo em breve".'
      >
        <Select id="lesson-video" name="videoId" defaultValue={item?.videoId ?? ""}>
          <option value="">Sem vídeo (em breve)</option>
          {videos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Status" htmlFor="lesson-status">
        <Select id="lesson-status" name="status" defaultValue={item?.status ?? "draft"}>
          {Object.entries(CONTENT_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Resumo (opcional)"
        htmlFor="lesson-summary"
        error={errors.summary}
        className="md:col-span-2"
      >
        <Textarea
          id="lesson-summary"
          name="summary"
          defaultValue={item?.summary}
          maxLength={400}
          className="min-h-16"
        />
      </Field>
      {compact ? null : (
        <Field
          label="Texto de apoio (Markdown + LaTeX)"
          htmlFor="lesson-content"
          error={errors.content}
          className="md:col-span-2"
        >
          <MarkdownEditor
            id="lesson-content"
            name="content"
            defaultValue={item?.content}
            rows={10}
          />
        </Field>
      )}
      <div className="md:col-span-2">
        <Checkbox
          name="isPreview"
          defaultChecked={item?.isPreview ?? false}
          label="Aula grátis (aberta sem login; vídeo do YouTube; limite definido na disciplina)"
        />
        {errors.isPreview ? (
          <p className="text-danger mt-1 text-xs">{errors.isPreview[0]}</p>
        ) : null}
      </div>
      <div className="md:col-span-2">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
