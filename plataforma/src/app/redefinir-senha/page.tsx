import type { Metadata } from "next";
import { ButtonLink } from "@portfolio/ui/Button";
import { AuthCard, FormAlert } from "@/components/auth/AuthFields";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Nova senha",
  robots: { index: false },
  // O token vai na URL: não manda o endereço para outros sites.
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<{ token?: string; error?: string }> };

/**
 * Nova senha. O link do e-mail passa pelo Better Auth, que confere o token e
 * manda para cá com ?token= (válido) ou ?error= (inválido ou expirado).
 */
export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams;
  const valid = Boolean(token) && !error;

  return (
    <AuthCard title="Criar nova senha">
      {valid && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <>
          <FormAlert tone="error">
            Este link é inválido, expirou ou já foi usado. Os links valem por 1 hora e só uma vez.
          </FormAlert>
          <ButtonLink href="/esqueci-a-senha">Pedir novo link</ButtonLink>
        </>
      )}
    </AuthCard>
  );
}
