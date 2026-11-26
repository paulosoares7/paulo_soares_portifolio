"use client";

import { useState } from "react";
import { Button } from "@portfolio/ui/Button";
import { FormAlert, TextField } from "@/components/auth/AuthFields";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { type FieldErrors, signUpSchema, validateForm } from "@/validators/auth";

/**
 * Cadastro com nome, e-mail e senha. Depois do envio, a resposta é sempre a
 * mesma (mesmo para e-mail já cadastrado): "confira o seu e-mail".
 * @param next Página para abrir depois da confirmação do e-mail.
 */
export function SignUpForm({ next }: { next: string }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (sentTo)
    return (
      <FormAlert tone="success">
        Pronto! Enviamos um link de confirmação para <strong>{sentTo}</strong>. Abra o e-mail e
        clique no link (vale por 1 hora) para entrar. Não chegou? Veja a caixa de spam.
      </FormAlert>
    );

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);
        const { data, errors: invalid } = validateForm(signUpSchema, event.currentTarget);
        setErrors(invalid ?? {});
        if (!data) return;
        setPending(true);
        const { error } = await authClient.signUp.email({
          ...data,
          callbackURL: `/confirmar-email?next=${encodeURIComponent(next)}`,
        });
        setPending(false);
        if (error) {
          setMessage(authErrorMessage(error));
          return;
        }
        setSentTo(data.email);
      }}
    >
      <TextField id="name" label="Nome" autoComplete="name" error={errors.name} />
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
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres."
        error={errors.password}
      />
      {message ? <FormAlert tone="error">{message}</FormAlert> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Criando a conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
