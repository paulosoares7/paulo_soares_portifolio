"use client";

import { saveGroup } from "@/actions/catalog";
import { TitleSlugFields } from "@/components/forms/TitleSlugFields";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { groupSchema } from "@/validators/catalog";

type GroupFormProps = {
  item?: { id: number; categoryId: number; slug: string; name: string; description: string };
  categories: { id: number; name: string; slug: string }[];
  defaultCategoryId?: number;
};

/** Grupo de uma categoria (ex.: PSC (UFAM), ENEM, 1º ano). Cria ou edita. */
export function GroupForm({ item, categories, defaultCategoryId }: GroupFormProps) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(groupSchema, saveGroup, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Categoria" htmlFor="grp-cat" error={errors.categoryId}>
        <Select
          id="grp-cat"
          name="categoryId"
          defaultValue={item?.categoryId ?? defaultCategoryId ?? ""}
          invalid={!!errors.categoryId}
        >
          <option value="" disabled>
            Escolha...
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <TitleSlugFields
        prefix="grp"
        titleLabel="Nome"
        titleName="name"
        defaultTitle={item?.name}
        defaultSlug={item?.slug}
        errors={errors}
        slugHint="Usado na URL: /aulas/vestibulares/psc-ufam"
      />
      <Field label="Descrição (opcional)" htmlFor="grp-desc" error={errors.description}>
        <Textarea
          id="grp-desc"
          name="description"
          defaultValue={item?.description}
          maxLength={300}
        />
      </Field>
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
