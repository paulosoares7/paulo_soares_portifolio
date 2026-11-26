"use client";

import { LogIn } from "lucide-react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { FormMessage } from "@/components/ui/FormMessage";
import { useFormAction } from "@/lib/use-form-action";
import { loginSchema } from "@/validators/auth";

/** Formulário de login do administrador. */
export function LoginForm() {
  const { formProps, state, pending, errors } = useFormAction(loginSchema, login);

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
      <Field label="Senha" htmlFor="password" error={errors.password}>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          invalid={!!errors.password}
        />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending}>
        <LogIn className="size-4" aria-hidden />
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
