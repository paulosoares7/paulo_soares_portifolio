"use client";

import { Send } from "lucide-react";
import { requestPasswordReset } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { useFormAction } from "@/lib/use-form-action";
import { forgotPasswordSchema } from "@/validators/auth";

/** Pede o link de redefinição da senha do painel. */
export function ForgotPasswordForm() {
  const { formProps, state, pending, errors } = useFormAction(
    forgotPasswordSchema,
    requestPasswordReset,
  );

  if (state.ok) return <FormMessage state={state} />;

  return (
    <form {...formProps} className="flex flex-col gap-4">
      <Field label="E-mail" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          invalid={!!errors.email}
        />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        <Send className="size-4" aria-hidden />
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
