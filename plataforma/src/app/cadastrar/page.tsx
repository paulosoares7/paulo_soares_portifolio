import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthFields";
import { GoogleSection, OrDivider, VisitorLink } from "@/components/auth/GoogleButton";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { getViewer } from "@/lib/access";
import { isGoogleEnabled } from "@/lib/auth";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } };

type Props = { searchParams: Promise<{ next?: string }> };

/** Cadastro com Google ou com nome, e-mail e senha (confirmação por e-mail). */
export default async function SignUpPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);
  if (await getViewer()) redirect(next);

  return (
    <AuthCard
      title="Criar conta"
      description="As aulas grátis já ficam abertas. Para as demais, é só assinar depois."
      footer={
        <>
          Já tem conta?{" "}
          <Link
            href={`/entrar?next=${encodeURIComponent(next)}`}
            className="text-accent font-medium hover:underline"
          >
            Entrar
          </Link>
        </>
      }
    >
      <GoogleSection
        next={next}
        enabled={isGoogleEnabled}
        showSetupHint={process.env.NODE_ENV !== "production"}
      />
      <SignUpForm next={next} />
      <OrDivider />
      <VisitorLink />
    </AuthCard>
  );
}
