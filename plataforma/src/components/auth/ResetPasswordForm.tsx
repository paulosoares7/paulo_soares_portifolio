"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@portfolio/ui/Button";
import { FormAlert, TextField } from "@/components/auth/AuthFields";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";
import { type FieldErrors, resetPasswordSchema, validateForm } from "@/validators/auth";

/**
 * Cria a nova senha com o token do link (1 hora, uso único). Ao salvar, o
 * Better Auth encerra todas as sessões do aluno.
 * @param token Token que veio no link do e-mail.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  if (done)
    return (
      <>
        <FormAlert tone="success">
          Senha alterada. Por segurança, você saiu de todos os aparelhos. Entre com a nova senha.
        </FormAlert>
        <ButtonLink href="/entrar">Entrar</ButtonLink>
      </>
    );

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);
        const { data, errors: invalid } = validateForm(resetPasswordSchema, event.currentTarget);
        setErrors(invalid ?? {});
        if (!data) return;
        setPending(true);
        const { error } = await authClient.resetPassword({ newPassword: data.password, token });
        setPending(false);
        if (error) {
          setMessage(authErrorMessage(error));
          return;
        }
        setDone(true);
      }}
    >
      <TextField
        id="password"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres."
        error={errors.password}
      />
      <TextField
        id="confirm"
        label="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirm}
      />
      {message ? (
        <FormAlert tone="error">
          {message}{" "}
          <Link href="/esqueci-a-senha" className="underline">
            Pedir novo link
          </Link>
        </FormAlert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar nova senha"}
      </Button>
    </form>
  );
}
