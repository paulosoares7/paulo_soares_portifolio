"use client";

import { useState } from "react";
import { createCourtesy } from "@/actions/subscriptions";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { CodeReveal } from "@/components/ui/CodeReveal";
import { FormFooter } from "@/components/ui/FormFooter";
import { useFormAction } from "@/lib/use-form-action";
import type { CodeActionState } from "@/types/action";
import { courtesySchema } from "@/validators/subscription";

type CourtesyFormProps = {
  students: { id: number; label: string }[];
  plans: { id: number; name: string; maxCourses: number }[];
  courses: { id: number; title: string }[];
  defaultEnd: string;
};

/**
 * Assinatura de cortesia (gateway = manual): aluno existente ou novo,
 * disciplinas nas vagas e data de fim. Pode gerar o código na hora.
 */
export function CourtesyForm({ students, plans, courses, defaultEnd }: CourtesyFormProps) {
  const { formProps, state, pending, errors } = useFormAction<
    typeof courtesySchema,
    CodeActionState
  >(courtesySchema, createCourtesy, {
    resetOnSuccess: true,
  });
  const [mode, setMode] = useState<"existing" | "new">(students.length ? "existing" : "new");
  const [planId, setPlanId] = useState(plans[0]?.id ?? 0);
  const maxCourses = plans.find((p) => p.id === planId)?.maxCourses ?? 3;

  return (
    <div className="flex flex-col gap-4">
      {state.ok && state.code ? <CodeReveal code={state.code} emailed={state.emailed} /> : null}
      <form {...formProps} className="grid gap-4 md:grid-cols-2">
        <fieldset className="flex gap-4 text-sm md:col-span-2">
          <legend className="sr-only">Aluno</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
              disabled={!students.length}
              className="accent-accent"
            />
            Aluno cadastrado
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={mode === "new"}
              onChange={() => setMode("new")}
              className="accent-accent"
            />
            Aluno novo
          </label>
        </fieldset>

        {mode === "existing" ? (
          <Field
            label="Aluno"
            htmlFor="ct-student"
            error={errors.studentId}
            className="md:col-span-2"
          >
            <Select id="ct-student" name="studentId" defaultValue="">
              <option value="" disabled>
                Escolha...
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <>
            <Field label="Nome" htmlFor="ct-name" error={errors.name}>
              <Input id="ct-name" name="name" invalid={!!errors.name} />
            </Field>
            <Field label="E-mail" htmlFor="ct-email" error={errors.email}>
              <Input id="ct-email" name="email" type="email" invalid={!!errors.email} />
            </Field>
            <Field
              label="Nome no fórum (opcional)"
              htmlFor="ct-display"
              error={errors.displayName}
              hint="Vazio = primeiro nome."
            >
              <Input id="ct-display" name="displayName" maxLength={60} />
            </Field>
          </>
        )}

        <Field label="Plano" htmlFor="ct-plan" error={errors.planId}>
          <Select
            id="ct-plan"
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
        <Field label="Acesso até" htmlFor="ct-end" error={errors.periodEnd}>
          <Input
            id="ct-end"
            name="periodEnd"
            type="date"
            defaultValue={defaultEnd}
            invalid={!!errors.periodEnd}
          />
        </Field>

        <fieldset className="flex flex-col gap-2 md:col-span-2">
          <legend className="mb-1 text-sm font-medium">
            Disciplinas (até {maxCourses}; ocupam as vagas na ordem da lista)
          </legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {courses.map((c) => (
              <Checkbox key={c.id} name="courseIds[]" value={c.id} label={c.title} />
            ))}
          </div>
          {errors.courseIds ? <p className="text-danger text-xs">{errors.courseIds[0]}</p> : null}
        </fieldset>

        <div className="md:col-span-2">
          <Checkbox
            name="generateCode"
            defaultChecked
            label="Gerar o código de acesso agora (revoga o código anterior do aluno)"
          />
        </div>
        <div className="md:col-span-2">
          <FormFooter state={state} pending={pending} label="Criar cortesia" />
        </div>
      </form>
    </div>
  );
}
