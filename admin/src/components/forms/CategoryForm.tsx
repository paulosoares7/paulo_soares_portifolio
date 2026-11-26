"use client";

import { saveCategory } from "@/actions/catalog";
import { TitleSlugFields } from "@/components/forms/TitleSlugFields";
import { Field, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { categorySchema } from "@/validators/catalog";

/** Categoria do catálogo (cria ou edita). */
export function CategoryForm({
  item,
}: {
  item?: { id: number; slug: string; name: string; description: string };
}) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(categorySchema, saveCategory, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <TitleSlugFields
        prefix="cat"
        titleLabel="Nome"
        titleName="name"
        defaultTitle={item?.name}
        defaultSlug={item?.slug}
        errors={errors}
        slugHint="Usado na URL: /aulas/vestibulares"
      />
      <Field label="Descrição (opcional)" htmlFor="cat-desc" error={errors.description}>
        <Textarea
          id="cat-desc"
          name="description"
          defaultValue={item?.description}
          maxLength={300}
        />
      </Field>
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
