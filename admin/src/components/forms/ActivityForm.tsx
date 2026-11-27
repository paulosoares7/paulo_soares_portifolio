"use client";

import { saveActivity } from "@/actions/activities";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { MarkdownEditor } from "@/components/ui/MarkdownEditor";
import { CONTENT_STATUSES, DIFFICULTIES, SHOW_ANSWERS } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import type { CourseTree } from "@/types/catalog";
import { activitySchema } from "@/validators/activity";

/** Valores de uma atividade para edição. */
export type ActivityValues = {
  id: number;
  moduleId: number;
  title: string;
  instructions: string;
  difficulty: string;
  maxAttempts: string;
  showAnswers: string;
  isPreview: boolean;
  status: string;
};

/** Atividade de um módulo: título, instruções, dificuldade, tentativas, resolução e grátis. */
export function ActivityForm({ item, tree }: { item?: ActivityValues; tree: CourseTree[] }) {
  const { formProps, state, pending, errors } = useFormAction(activitySchema, saveActivity);

  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Módulo" htmlFor="act-module" error={errors.moduleId} className="md:col-span-2">
        <Select
          id="act-module"
          name="moduleId"
          defaultValue={item?.moduleId ?? ""}
          invalid={!!errors.moduleId}
        >
          <option value="" disabled>
            Escolha...
          </option>
          {tree.map((course) => (
            <optgroup key={course.id} label={course.title}>
              {course.modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>
      <Field label="Título" htmlFor="act-title" error={errors.title} className="md:col-span-2">
        <Input id="act-title" name="title" defaultValue={item?.title} invalid={!!errors.title} />
      </Field>
      <Field
        label="Instruções (Markdown + LaTeX)"
        htmlFor="act-instructions"
        error={errors.instructions}
        className="md:col-span-2"
      >
        <MarkdownEditor
          id="act-instructions"
          name="instructions"
          defaultValue={item?.instructions}
          rows={4}
        />
      </Field>
      <Field label="Dificuldade" htmlFor="act-difficulty">
        <Select id="act-difficulty" name="difficulty" defaultValue={item?.difficulty ?? "medium"}>
          {Object.entries(DIFFICULTIES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Tentativas"
        htmlFor="act-attempts"
        error={errors.maxAttempts}
        hint="Vazio = ilimitado."
      >
        <Input
          id="act-attempts"
          name="maxAttempts"
          inputMode="numeric"
          defaultValue={item?.maxAttempts}
          invalid={!!errors.maxAttempts}
        />
      </Field>
      <Field label="Mostrar resolução" htmlFor="act-show">
        <Select id="act-show" name="showAnswers" defaultValue={item?.showAnswers ?? "after_submit"}>
          {Object.entries(SHOW_ANSWERS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Status" htmlFor="act-status">
        <Select id="act-status" name="status" defaultValue={item?.status ?? "draft"}>
          {Object.entries(CONTENT_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <div className="md:col-span-2">
        <Checkbox
          name="isPreview"
          defaultChecked={item?.isPreview ?? false}
          label="Atividade grátis (aberta sem login; limite definido na disciplina)"
        />
        {errors.isPreview ? (
          <p className="text-danger mt-1 text-xs">{errors.isPreview[0]}</p>
        ) : null}
      </div>
      <div className="md:col-span-2">
        <FormFooter state={state} pending={pending} label={item ? "Salvar" : "Criar atividade"} />
      </div>
    </form>
  );
}
