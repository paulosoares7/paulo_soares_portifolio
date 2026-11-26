"use client";

import { saveDegree } from "@/actions/profile";
import { Field, Input, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { DEGREE_LEVELS, DEGREE_STATUSES } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import { degreeSchema } from "@/validators/profile";

type DegreeValues = {
  id: number;
  level: string;
  course: string;
  institution: string;
  startYear: string;
  endYear: string;
  status: string;
  thesisTitle: string;
  advisor: string;
};

/** Formação acadêmica (cria ou edita). */
export function DegreeForm({ item }: { item?: DegreeValues }) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(degreeSchema, saveDegree, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Nível" htmlFor="dg-level" error={errors.level}>
        <Select
          id="dg-level"
          name="level"
          defaultValue={item?.level ?? ""}
          invalid={!!errors.level}
        >
          <option value="" disabled>
            Escolha...
          </option>
          {Object.entries(DEGREE_LEVELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Situação" htmlFor="dg-status" error={errors.status}>
        <Select id="dg-status" name="status" defaultValue={item?.status ?? "completed"}>
          {Object.entries(DEGREE_STATUSES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Curso" htmlFor="dg-course" error={errors.course} className="sm:col-span-2">
        <Input id="dg-course" name="course" defaultValue={item?.course} invalid={!!errors.course} />
      </Field>
      <Field
        label="Instituição"
        htmlFor="dg-inst"
        error={errors.institution}
        className="sm:col-span-2"
      >
        <Input
          id="dg-inst"
          name="institution"
          defaultValue={item?.institution}
          invalid={!!errors.institution}
        />
      </Field>
      <Field label="Ano de início" htmlFor="dg-start" error={errors.startYear}>
        <Input
          id="dg-start"
          name="startYear"
          inputMode="numeric"
          defaultValue={item?.startYear}
          invalid={!!errors.startYear}
        />
      </Field>
      <Field
        label="Ano de conclusão"
        htmlFor="dg-end"
        error={errors.endYear}
        hint="Vazio = em andamento."
      >
        <Input
          id="dg-end"
          name="endYear"
          inputMode="numeric"
          defaultValue={item?.endYear}
          invalid={!!errors.endYear}
        />
      </Field>
      <Field
        label="Título do trabalho (opcional)"
        htmlFor="dg-thesis"
        error={errors.thesisTitle}
        className="sm:col-span-2"
      >
        <Input id="dg-thesis" name="thesisTitle" defaultValue={item?.thesisTitle} />
      </Field>
      <Field
        label="Orientador(a) (opcional)"
        htmlFor="dg-advisor"
        error={errors.advisor}
        className="sm:col-span-2"
      >
        <Input id="dg-advisor" name="advisor" defaultValue={item?.advisor} />
      </Field>
      <div className="sm:col-span-2">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
