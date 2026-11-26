import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard, FormAlert } from "@/components/auth/AuthFields";
import { GoogleSection, OrDivider, VisitorLink } from "@/components/auth/GoogleButton";
import { SignInForm } from "@/components/auth/SignInForm";
import { getViewer } from "@/lib/access";
import { isGoogleEnabled } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string; erro?: string }> };

/** Entrar com Google ou com e-mail e senha; volta para ?next= depois. */
export default async function SignInPage({ searchParams }: Props) {
  const { next: rawNext, erro } = await searchParams;
  const next = safeNext(rawNext);
  if (await getViewer()) redirect(next);

  return (
    <AuthCard
      title="Entrar"
      description="Acesse as suas disciplinas, atividades e o fórum."
      footer={
        <>
          Ainda não tem conta?{" "}
          <Link
            href={`/cadastrar?next=${encodeURIComponent(next)}`}
            className="text-accent font-medium hover:underline"
          >
            Criar conta
          </Link>
        </>
      }
    >
      {erro ? (
        <FormAlert tone="error">
          Não foi possível entrar com o Google. Tente de novo ou use e-mail e senha.
        </FormAlert>
      ) : null}
      <GoogleSection
        next={next}
        enabled={isGoogleEnabled}
        showSetupHint={process.env.NODE_ENV !== "production"}
      />
      <SignInForm next={next} />
      <OrDivider />
      <VisitorLink />
    </AuthCard>
  );
}
