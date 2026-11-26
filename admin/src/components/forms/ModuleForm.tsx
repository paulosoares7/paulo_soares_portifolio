"use client";

import { saveModule } from "@/actions/catalog";
import { TitleSlugFields } from "@/components/forms/TitleSlugFields";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { CONTENT_STATUSES } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import { moduleSchema } from "@/validators/catalog";

type ModuleValues = {
  id: number;
  slug: string;
  title: string;
  description: string;
  status: string;
};

/** Módulo de uma disciplina (cria ou edita). */
export function ModuleForm({ courseId, item }: { courseId: number; item?: ModuleValues }) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(moduleSchema, saveModule, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <input type="hidden" name="courseId" value={courseId} />
      <TitleSlugFields
        prefix="mod"
        titleLabel="Título do módulo"
        defaultTitle={item?.title}
        defaultSlug={item?.slug}
        errors={errors}
        slugHint="Ex.: cinematica"
      />
      <Field label="Descrição (opcional)" htmlFor="mod-desc" error={errors.description}>
        <Textarea id="mod-desc" name="description" defaultValue={item?.description} />
      </Field>
      <Field label="Status" htmlFor="mod-status">
        <Select id="mod-status" name="status" defaultValue={item?.status ?? "draft"}>
          {Object.entries(CONTENT_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
