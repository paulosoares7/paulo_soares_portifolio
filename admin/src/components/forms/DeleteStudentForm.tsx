"use client";

import { Trash2, UserX } from "lucide-react";
import { deleteStudent } from "@/actions/students";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { useFormAction } from "@/lib/use-form-action";
import { deleteStudentSchema } from "@/validators/subscription";

/**
 * Confirmação da exclusão: o admin digita o e-mail do aluno. O texto do que
 * vai acontecer (apagar ou anonimizar) vem da página, calculado no servidor.
 */
export function DeleteStudentForm({
  studentId,
  email,
  anonymize,
}: {
  studentId: number;
  email: string;
  anonymize: boolean;
}) {
  const { formProps, state, pending, errors } = useFormAction(deleteStudentSchema, deleteStudent);
  const Icon = anonymize ? UserX : Trash2;
  return (
    <form {...formProps} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={studentId} />
      <Field
        label={`Para confirmar, digite o e-mail do aluno: ${email}`}
        htmlFor="del-email"
        error={errors.confirmEmail}
      >
        <Input
          id="del-email"
          name="confirmEmail"
          autoComplete="off"
          spellCheck={false}
          invalid={!!errors.confirmEmail}
          className="max-w-md"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="danger" disabled={pending}>
          <Icon className="size-4" aria-hidden />
          {pending ? "Excluindo..." : anonymize ? "Anonimizar aluno" : "Excluir aluno"}
        </Button>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
