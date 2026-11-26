"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@portfolio/ui/Button";
import { FormAlert, TextField } from "@/components/auth/AuthFields";
import { authClient } from "@/lib/auth-client";
import { useLiveForm } from "@/lib/use-live-form";
import { authErrorMessage } from "@/lib/auth-errors";
import { signInSchema, validateForm } from "@/validators/auth";

/**
 * Entrar com e-mail e senha. O limite de tentativas e a exigência de e-mail
 * confirmado ficam no servidor (lib/auth.ts).
 * @param next Página para voltar depois do login.
 */
export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const { errors, setErrors, ready, formProps } = useLiveForm(signInSchema);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      {...formProps}
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);
        const { data, errors: invalid } = validateForm(signInSchema, event.currentTarget);
        setErrors(invalid ?? {});
        if (!data) return;
        setPending(true);
        const { error } = await authClient.signIn.email({ ...data, callbackURL: next });
        if (error) {
          setMessage(authErrorMessage(error));
          setPending(false);
          return;
        }
        // Recarrega os Server Components já com a sessão.
        router.replace(next);
        router.refresh();
      }}
    >
      <TextField
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email}
      />
      <TextField
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password}
      />
      <Link href="/esqueci-a-senha" className="text-accent -mt-2 self-end text-sm hover:underline">
        Esqueci a senha
      </Link>
      {message ? <FormAlert tone="error">{message}</FormAlert> : null}
      <Button type="submit" disabled={pending || !ready}>
        {pending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
