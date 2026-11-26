"use client";

import { useState } from "react";
import { Button } from "@portfolio/ui/Button";
import { FormAlert, TextField } from "@/components/auth/AuthFields";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { type FieldErrors, forgotPasswordSchema, validateForm } from "@/validators/auth";

/**
 * Pede o link de redefinição. A resposta não revela se o e-mail tem conta:
 * a mensagem é a mesma nos dois casos.
 */
export function ForgotPasswordForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  if (done)
    return (
      <FormAlert tone="success">
        Se este e-mail tiver uma conta, você vai receber um link para criar uma nova senha. O link
        vale por 1 hora e só pode ser usado uma vez. Não chegou? Veja a caixa de spam.
      </FormAlert>
    );

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);
        const { data, errors: invalid } = validateForm(forgotPasswordSchema, event.currentTarget);
        setErrors(invalid ?? {});
        if (!data) return;
        setPending(true);
        const { error } = await authClient.requestPasswordReset({
          email: data.email,
          redirectTo: "/redefinir-senha",
        });
        setPending(false);
        // Só o limite de tentativas aparece; qualquer outro caso mostra a mensagem neutra.
        if (error?.status === 429) {
          setMessage(authErrorMessage(error));
          return;
        }
        setDone(true);
      }}
    >
      <TextField
        id="email"
        label="E-mail da conta"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email}
      />
      {message ? <FormAlert tone="error">{message}</FormAlert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Enviando..." : "Enviar link"}
      </Button>
    </form>
  );
}
