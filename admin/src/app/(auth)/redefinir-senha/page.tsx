import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";
import { AuthCard } from "@/components/layout/AuthCard";
import { buttonClasses } from "@/components/ui/Button";
import { isAdminResetTokenValid } from "@/lib/admin-password-reset";

export const metadata: Metadata = {
  title: "Nova senha",
  // O token vai na URL: não manda o endereço para outros sites.
  referrer: "no-referrer",
};

type Props = { searchParams: Promise<{ token?: string }> };

/** Nova senha do painel, com o token do link do e-mail (1 hora, uso único). */
export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const valid = token ? await isAdminResetTokenValid(token) : false;

  return (
    <AuthCard
      description={
        valid
          ? "Crie a nova senha. Depois, entre de novo: todas as sessões do painel serão encerradas."
          : "Este link é inválido, expirou ou já foi usado. Os links valem por 1 hora e só uma vez."
      }
    >
      {valid && token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Link href="/esqueci-a-senha" className={`${buttonClasses("primary")} w-full`}>
          Pedir novo link
        </Link>
      )}
    </AuthCard>
  );
}
