"use client";

import { saveExperience } from "@/actions/profile";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { experienceSchema } from "@/validators/profile";

type ExperienceValues = {
  id: number;
  institution: string;
  role: string;
  description: string;
  startDate: string;
  endDate: string;
};

/** Atuação profissional (cria ou edita). */
export function ExperienceForm({ item }: { item?: ExperienceValues }) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(experienceSchema, saveExperience, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field
        label="Instituição"
        htmlFor="ex-inst"
        error={errors.institution}
        className="sm:col-span-2"
      >
        <Input
          id="ex-inst"
          name="institution"
          defaultValue={item?.institution}
          invalid={!!errors.institution}
        />
      </Field>
      <Field label="Cargo / função" htmlFor="ex-role" error={errors.role} className="sm:col-span-2">
        <Input id="ex-role" name="role" defaultValue={item?.role} invalid={!!errors.role} />
      </Field>
      <Field label="Início" htmlFor="ex-start" error={errors.startDate}>
        <Input
          id="ex-start"
          name="startDate"
          type="date"
          defaultValue={item?.startDate}
          invalid={!!errors.startDate}
        />
      </Field>
      <Field label="Fim" htmlFor="ex-end" error={errors.endDate} hint="Vazio = atual.">
        <Input
          id="ex-end"
          name="endDate"
          type="date"
          defaultValue={item?.endDate}
          invalid={!!errors.endDate}
        />
      </Field>
      <Field
        label="Descrição (opcional)"
        htmlFor="ex-desc"
        error={errors.description}
        className="sm:col-span-2"
      >
        <Textarea id="ex-desc" name="description" defaultValue={item?.description} />
      </Field>
      <div className="sm:col-span-2">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
