"use client";

import { useState } from "react";
import { createStudent } from "@/actions/students";
import { CourseSlotsField, type CourseOption } from "@/components/forms/CourseSlotsField";
import type { PlanOption } from "@/components/forms/CourtesyToggle";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { Switch } from "@/components/ui/Switch";
import { useFormAction } from "@/lib/use-form-action";
import { newStudentSchema } from "@/validators/subscription";

/**
 * Adicionar aluno: nome, e-mail, cortesia opcional (dias e disciplinas) e
 * convite por e-mail para criar a senha ou entrar com o Google.
 */
export function NewStudentForm({
  plans,
  courses,
  inviteDays,
}: {
  plans: PlanOption[];
  courses: CourseOption[];
  inviteDays: number;
}) {
  const { formProps, state, pending, errors } = useFormAction(newStudentSchema, createStudent, {
    resetOnSuccess: true,
  });
  const [courtesy, setCourtesy] = useState(false);
  const [planId, setPlanId] = useState(plans[0]?.id ?? 0);
  const limit = plans.find((p) => p.id === planId)?.maxCourses ?? 3;

  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-2">
      <Field label="Nome" htmlFor="ns-name" error={errors.name}>
        <Input id="ns-name" name="name" autoComplete="off" invalid={!!errors.name} />
      </Field>
      <Field label="E-mail" htmlFor="ns-email" error={errors.email}>
        <Input
          id="ns-email"
          name="email"
          type="email"
          autoComplete="off"
          invalid={!!errors.email}
        />
      </Field>
      <Field
        label="Nome no fórum (opcional)"
        htmlFor="ns-display"
        error={errors.displayName}
        hint="Vazio = primeiro nome."
      >
        <Input id="ns-display" name="displayName" maxLength={60} />
      </Field>
      <div className="flex items-end pb-2">
        <Checkbox
          name="sendInvite"
          defaultChecked
          label={`Enviar convite por e-mail (link vale ${inviteDays} dias)`}
        />
      </div>

      <div className="md:col-span-2">
        {/* O valor vai no FormData; o Switch só controla a parte visível. */}
        {courtesy ? <input type="hidden" name="courtesy" value="on" /> : null}
        <Switch checked={courtesy} onChange={setCourtesy} label="Dar cortesia" />
      </div>
      {courtesy ? (
        <div className="rounded-btn border-success/40 bg-success/5 grid gap-4 border p-4 md:col-span-2 md:grid-cols-2">
          <Field label="Plano" htmlFor="ns-plan" error={errors.planId}>
            <Select
              id="ns-plan"
              name="planId"
              value={planId}
              onChange={(e) => setPlanId(Number(e.target.value))}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.maxCourses} vaga(s))
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Dias de cortesia"
            htmlFor="ns-days"
            error={errors.days}
            hint="Hoje conta como o 1º dia."
          >
            <Input
              id="ns-days"
              name="days"
              type="number"
              min={1}
              max={3650}
              defaultValue={30}
              invalid={!!errors.days}
            />
          </Field>
          <div className="md:col-span-2">
            <CourseSlotsField courses={courses} limit={limit} error={errors.courseIds} />
          </div>
        </div>
      ) : null}

      <p className="text-muted text-sm md:col-span-2">
        O aluno recebe um link para criar a senha. Ele também pode entrar com o Google usando este
        mesmo e-mail.
      </p>
      <div className="md:col-span-2">
        <FormFooter state={state} pending={pending} label="Adicionar aluno" />
      </div>
    </form>
  );
}
