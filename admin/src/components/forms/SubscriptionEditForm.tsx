"use client";

import { useState } from "react";
import { updateSubscription } from "@/actions/subscriptions";
import { CourseSlotsField, type CourseOption } from "@/components/forms/CourseSlotsField";
import type { PlanOption } from "@/components/forms/CourtesyToggle";
import { Field, Input, Select } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { useFormAction } from "@/lib/use-form-action";
import { subscriptionEditSchema } from "@/validators/subscription";

/** Valores atuais da assinatura para o formulário. */
export type SubscriptionEditValues = {
  id: number;
  planId: number;
  maxCoursesOverride: number | null;
  courseIds: number[];
  isCourtesy: boolean;
  status: string;
  statusLabel: string;
  periodEnd: string;
};

/**
 * Editar a assinatura: plano, vagas só deste aluno, disciplinas nas vagas e,
 * na cortesia, status e "acesso até". Na assinatura do Asaas o status vem do
 * Asaas e as cobranças não mudam aqui.
 */
export function SubscriptionEditForm({
  item,
  plans,
  courses,
}: {
  item: SubscriptionEditValues;
  plans: PlanOption[];
  courses: CourseOption[];
}) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(
    subscriptionEditSchema,
    updateSubscription,
    { onSuccess: close },
  );
  const [planId, setPlanId] = useState(item.planId);
  const [override, setOverride] = useState(item.maxCoursesOverride?.toString() ?? "");
  const planSlots = plans.find((p) => p.id === planId)?.maxCourses ?? 3;
  const limit = Number(override) >= 1 ? Number(override) : planSlots;

  return (
    <form {...formProps} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={item.id} />
      <Field label="Plano" htmlFor={`se-plan-${item.id}`} error={errors.planId}>
        <Select
          id={`se-plan-${item.id}`}
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
        label="Vagas deste aluno"
        htmlFor={`se-slots-${item.id}`}
        error={errors.maxCoursesOverride}
        hint={`Vazio = as do plano (${planSlots}). Exceção de 1 a 10.`}
      >
        <Input
          id={`se-slots-${item.id}`}
          name="maxCoursesOverride"
          type="number"
          min={1}
          max={10}
          value={override}
          onChange={(e) => setOverride(e.target.value)}
          invalid={!!errors.maxCoursesOverride}
        />
      </Field>
      <div className="md:col-span-2">
        <CourseSlotsField
          courses={courses}
          limit={limit}
          defaultSelected={item.courseIds}
          error={errors.courseIds}
        />
      </div>

      {item.isCourtesy ? (
        <>
          <Field label="Status da cortesia" htmlFor={`se-status-${item.id}`} error={errors.status}>
            <Select id={`se-status-${item.id}`} name="status" defaultValue={item.status}>
              <option value="active">Ativa</option>
              <option value="canceled">Cancelada (acesso até a data abaixo)</option>
              <option value="expired">Encerrada agora (acesso termina na hora)</option>
            </Select>
          </Field>
          <Field label="Acesso até" htmlFor={`se-end-${item.id}`} error={errors.periodEnd}>
            <Input
              id={`se-end-${item.id}`}
              name="periodEnd"
              type="date"
              defaultValue={item.periodEnd}
              invalid={!!errors.periodEnd}
            />
          </Field>
        </>
      ) : (
        <p className="text-muted text-sm md:col-span-2">
          Status: <span className="text-text">{item.statusLabel}</span>. Na assinatura paga o status
          e as cobranças vêm do Asaas e não são editados aqui.
        </p>
      )}
      <div className="md:col-span-2">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
