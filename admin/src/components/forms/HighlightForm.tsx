"use client";

import { saveHighlight } from "@/actions/profile";
import { Field, Input } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { highlightSchema } from "@/validators/profile";

/** Número de destaque da home (cria ou edita). */
export function HighlightForm({ item }: { item?: { id: number; value: string; label: string } }) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(highlightSchema, saveHighlight, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Número" htmlFor="hl-value" error={errors.value} hint="Ex.: 10+">
        <Input
          id="hl-value"
          name="value"
          defaultValue={item?.value}
          maxLength={20}
          invalid={!!errors.value}
        />
      </Field>
      <Field label="Descrição" htmlFor="hl-label" error={errors.label} hint="Ex.: anos de docência">
        <Input
          id="hl-label"
          name="label"
          defaultValue={item?.label}
          maxLength={60}
          invalid={!!errors.label}
        />
      </Field>
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
