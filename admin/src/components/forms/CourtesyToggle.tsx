"use client";

import { useState, useTransition } from "react";
import { createCourtesy, endCourtesy } from "@/actions/subscriptions";
import { CourseSlotsField, type CourseOption } from "@/components/forms/CourseSlotsField";
import { Field, Input, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { FormMessage } from "@/components/ui/FormMessage";
import { Switch } from "@/components/ui/Switch";
import { useFormAction } from "@/lib/use-form-action";
import type { ActionState } from "@/types/action";
import { courtesySchema } from "@/validators/subscription";

/** Plano oferecido na cortesia. */
export type PlanOption = { id: number; name: string; maxCourses: number };

type CourtesyToggleProps = {
  studentId: number;
  plans: PlanOption[];
  courses: CourseOption[];
  /** Cortesia vigente (ligada) ou null. */
  active: { subscriptionId: number; endLabel: string } | null;
  /** Aluno com assinatura paga vigente não recebe cortesia por cima. */
  blockedReason?: string;
};

/**
 * Cortesia do aluno como botão de ligar e desligar. Desligada no padrão; ao
 * ligar, pede os dias e as disciplinas; ligada, fica verde com a data final.
 */
export function CourtesyToggle({
  studentId,
  plans,
  courses,
  active,
  blockedReason,
}: CourtesyToggleProps) {
  const [opening, setOpening] = useState(false);
  const [planId, setPlanId] = useState(plans[0]?.id ?? 0);
  const [result, setResult] = useState<ActionState>({ ok: false });
  const [ending, startEnding] = useTransition();
  const { formProps, state, pending, errors } = useFormAction(courtesySchema, createCourtesy, {
    onSuccess: () => setOpening(false),
  });
  const limit = plans.find((p) => p.id === planId)?.maxCourses ?? 3;
  const on = Boolean(active) || opening;

  function toggle(next: boolean): void {
    if (next) {
      setResult({ ok: false });
      setOpening(true);
      return;
    }
    if (!active) {
      setOpening(false);
      return;
    }
    if (!window.confirm("Desligar a cortesia agora? O acesso do aluno termina na hora.")) return;
    startEnding(async () => setResult(await endCourtesy(active.subscriptionId)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Switch
          checked={on}
          onChange={toggle}
          label={active ? `Cortesia ligada · acesso até ${active.endLabel}` : "Cortesia"}
          disabled={ending || (!active && Boolean(blockedReason))}
        />
        {!active && blockedReason ? (
          <span className="text-muted text-xs">{blockedReason}</span>
        ) : null}
      </div>
      <FormMessage state={result.message ? result : state} />

      {opening && !active ? (
        <form
          {...formProps}
          className="rounded-btn border-success/40 bg-success/5 grid gap-4 border p-4 md:grid-cols-2"
        >
          <input type="hidden" name="studentId" value={studentId} />
          <Field label="Plano" htmlFor={`ct-plan-${studentId}`} error={errors.planId}>
            <Select
              id={`ct-plan-${studentId}`}
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
            htmlFor={`ct-days-${studentId}`}
            error={errors.days}
            hint="Hoje conta como o 1º dia."
          >
            <Input
              id={`ct-days-${studentId}`}
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
          <div className="md:col-span-2">
            <FormFooter state={{ ok: false }} pending={pending} label="Ligar cortesia" />
          </div>
        </form>
      ) : null}
    </div>
  );
}
