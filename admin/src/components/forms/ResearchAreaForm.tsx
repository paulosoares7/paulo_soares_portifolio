"use client";

import { saveResearchArea } from "@/actions/profile";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { researchAreaSchema } from "@/validators/profile";

/** Área de pesquisa (cria ou edita). */
export function ResearchAreaForm({
  item,
}: {
  item?: { id: number; name: string; description: string };
}) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(
    researchAreaSchema,
    saveResearchArea,
    { onSuccess: close },
  );

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Nome" htmlFor="ra-name" error={errors.name}>
        <Input id="ra-name" name="name" defaultValue={item?.name} invalid={!!errors.name} />
      </Field>
      <Field label="Descrição (opcional)" htmlFor="ra-desc" error={errors.description}>
        <Textarea
          id="ra-desc"
          name="description"
          defaultValue={item?.description}
          maxLength={400}
        />
      </Field>
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
