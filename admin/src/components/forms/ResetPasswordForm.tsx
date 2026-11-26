"use client";

import { KeyRound } from "lucide-react";
import { resetPassword } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { useFormAction } from "@/lib/use-form-action";
import { resetPasswordSchema } from "@/validators/auth";

/**
 * Nova senha do painel. Ao salvar, todas as sessões do admin são encerradas.
 * @param token Token do link do e-mail.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const { formProps, state, pending, errors } = useFormAction(resetPasswordSchema, resetPassword);

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Field
        label="Nova senha"
        htmlFor="password"
        error={errors.password}
        hint="Pelo menos 12 caracteres."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          invalid={!!errors.password}
        />
      </Field>
      <Field label="Repita a nova senha" htmlFor="confirm" error={errors.confirm}>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          invalid={!!errors.confirm}
        />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        <KeyRound className="size-4" aria-hidden />
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
