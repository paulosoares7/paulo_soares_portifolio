"use client";

import { extendCourtesy } from "@/actions/subscriptions";
import { Field, Input } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { extendSchema } from "@/validators/subscription";

/** Nova data de fim para uma cortesia. */
export function ExtendCourtesyForm({
  subscriptionId,
  currentEnd,
}: {
  subscriptionId: number;
  currentEnd: string;
}) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(extendSchema, extendCourtesy, {
    onSuccess: close,
  });
  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <Field label="Acesso até" htmlFor="ext-end" error={errors.periodEnd}>
        <Input
          id="ext-end"
          name="periodEnd"
          type="date"
          defaultValue={currentEnd}
          invalid={!!errors.periodEnd}
        />
      </Field>
      <FormFooter state={state} pending={pending} />
    </form>
  );
}
