"use client";

import { gradeAnswer } from "@/actions/activities";
import { Field, Input } from "@/components/ui/Field";
import { FormFooter } from "@/components/ui/FormFooter";
import { useFormAction } from "@/lib/use-form-action";
import { gradeSchema } from "@/validators/activity";

/** Correção manual de uma resposta aberta: certo/errado e pontos. */
export function GradeAnswerForm({ answerId, maxPoints }: { answerId: number; maxPoints: string }) {
  const { formProps, state, pending, errors } = useFormAction(gradeSchema, gradeAnswer);

  return (
    <form {...formProps} className="flex flex-wrap items-end gap-4">
      <input type="hidden" name="answerId" value={answerId} />
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-medium">Resultado</legend>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="isCorrect" value="true" className="accent-success" /> Certa
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="isCorrect" value="false" className="accent-danger" /> Errada
          </label>
        </div>
        {errors.isCorrect ? <p className="text-danger text-xs">{errors.isCorrect[0]}</p> : null}
      </fieldset>
      <Field
        label={`Pontos (máx. ${maxPoints})`}
        htmlFor={`grade-${answerId}`}
        error={errors.pointsAwarded}
      >
        <Input
          id={`grade-${answerId}`}
          name="pointsAwarded"
          className="w-28"
          invalid={!!errors.pointsAwarded}
        />
      </Field>
      <div className="flex-1">
        <FormFooter state={state} pending={pending} label="Salvar correção" />
      </div>
    </form>
  );
}
