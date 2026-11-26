"use client";

import { savePlan } from "@/actions/subscriptions";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useCloseModal } from "@/components/ui/ModalTrigger";
import { BILLING_CYCLES } from "@/lib/labels";
import { useFormAction } from "@/lib/use-form-action";
import { planSchema } from "@/validators/subscription";

type PlanValues = {
  id: number;
  name: string;
  description: string;
  price: string;
  billingCycle: string;
  maxCourses: number;
  isActive: boolean;
};

/** Plano e preço. O preço novo vale só para assinaturas futuras. */
export function PlanForm({ item }: { item?: PlanValues }) {
  const close = useCloseModal();
  const { formProps, state, pending, errors } = useFormAction(planSchema, savePlan, {
    onSuccess: close,
  });

  return (
    <form {...formProps} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Nome" htmlFor="plan-name" error={errors.name} className="sm:col-span-2">
        <Input id="plan-name" name="name" defaultValue={item?.name} invalid={!!errors.name} />
      </Field>
      <Field
        label="Descrição"
        htmlFor="plan-desc"
        error={errors.description}
        className="sm:col-span-2"
      >
        <Textarea
          id="plan-desc"
          name="description"
          defaultValue={item?.description}
          maxLength={400}
          className="min-h-16"
        />
      </Field>
      <Field label="Preço (R$)" htmlFor="plan-price" error={errors.priceCents} hint="Ex.: 19,90">
        <Input
          id="plan-price"
          name="priceCents"
          inputMode="decimal"
          defaultValue={item?.price}
          invalid={!!errors.priceCents}
        />
      </Field>
      <Field label="Cobrança" htmlFor="plan-cycle">
        <Select id="plan-cycle" name="billingCycle" defaultValue={item?.billingCycle ?? "monthly"}>
          {Object.entries(BILLING_CYCLES).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Vagas de disciplina"
        htmlFor="plan-max"
        error={errors.maxCourses}
        hint="Padrão 3. Reduzir não apaga disciplinas: as vagas a mais saem na renovação."
      >
        <Select id="plan-max" name="maxCourses" defaultValue={item?.maxCourses ?? 3}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex items-end pb-2">
        <Checkbox name="isActive" defaultChecked={item?.isActive ?? true} label="À venda" />
      </div>
      <p className="text-muted text-xs sm:col-span-2">
        Mudar o preço não altera quem já assina (cada assinatura guarda o preço contratado).
      </p>
      <div className="sm:col-span-2">
        <FormFooter state={state} pending={pending} />
      </div>
    </form>
  );
}
