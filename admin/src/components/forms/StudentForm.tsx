"use client";

import { saveStudent } from "@/actions/students";
import { Checkbox, Field, Input } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useFormAction } from "@/lib/use-form-action";
import { studentSchema } from "@/validators/subscription";

type StudentValues = {
  id: number;
  name: string;
  displayName: string;
  email: string;
  isBlocked: boolean;
};

/** Dados do aluno. Bloquear encerra as sessões abertas. */
export function StudentForm({ item }: { item: StudentValues }) {
  const { formProps, state, pending, errors } = useFormAction(studentSchema, saveStudent);
  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-3">
      <input type="hidden" name="id" value={item.id} />
      <Field label="Nome" htmlFor="st-name" error={errors.name}>
        <Input id="st-name" name="name" defaultValue={item.name} invalid={!!errors.name} />
      </Field>
      <Field label="Nome no fórum" htmlFor="st-display" error={errors.displayName}>
        <Input
          id="st-display"
          name="displayName"
          defaultValue={item.displayName}
          invalid={!!errors.displayName}
        />
      </Field>
      <Field label="E-mail" htmlFor="st-email" error={errors.email}>
        <Input
          id="st-email"
          name="email"
          type="email"
          defaultValue={item.email}
          invalid={!!errors.email}
        />
      </Field>
      <div className="md:col-span-3">
        <Checkbox
          name="isBlocked"
          defaultChecked={item.isBlocked}
          label="Bloqueado (não consegue entrar)"
        />
      </div>
      <div className="md:col-span-3">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
