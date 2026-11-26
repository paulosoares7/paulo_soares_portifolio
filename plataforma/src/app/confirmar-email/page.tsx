import type { Metadata } from "next";
import { ButtonLink } from "@portfolio/ui/Button";
import { AuthCard, FormAlert } from "@/components/auth/AuthFields";
import { getViewer } from "@/lib/access";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Confirmar e-mail", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

/**
 * Destino do link de confirmação. O Better Auth confere o link, confirma o
 * e-mail e já abre a sessão; se o link falhar, chega aqui com ?error=.
 */
export default async function ConfirmEmailPage({ searchParams }: Props) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNext(rawNext);
  const viewer = error ? null : await getViewer();

  return (
    <AuthCard title="Confirmação de e-mail">
      {error ? (
        <>
          <FormAlert tone="error">
            Este link de confirmação é inválido ou expirou (vale por 1 hora). Tente entrar com o seu
            e-mail e senha: enviaremos um novo link.
          </FormAlert>
          <ButtonLink href="/entrar">Entrar</ButtonLink>
        </>
      ) : viewer ? (
        <>
          <FormAlert tone="success">
            E-mail confirmado. Boas-vindas, {viewer.name.split(" ")[0]}!
          </FormAlert>
          <ButtonLink href={next}>Continuar</ButtonLink>
        </>
      ) : (
        <>
          <FormAlert tone="success">E-mail confirmado. Agora é só entrar.</FormAlert>
          <ButtonLink href={`/entrar?next=${encodeURIComponent(next)}`}>Entrar</ButtonLink>
        </>
      )}
    </AuthCard>
  );
}
