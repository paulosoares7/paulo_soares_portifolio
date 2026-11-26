import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { AuthCard } from "@/components/layout/AuthCard";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

type Props = { searchParams: Promise<{ senha?: string }> };

/** Página de login (RF22). Quem já está logado vai direto para o resumo. */
export default async function LoginPage({ searchParams }: Props) {
  if (await getCurrentAdmin()) redirect("/");
  const { senha } = await searchParams;

  return (
    <AuthCard description="Entre com seu e-mail e senha de administrador.">
      {senha === "alterada" ? (
        <p role="status" className="text-success mb-4 text-sm">
          Senha alterada. Entre com a nova senha.
        </p>
      ) : null}
      <LoginForm />
      <Link
        href="/esqueci-a-senha"
        className="text-accent mt-6 block text-center text-sm hover:underline"
      >
        Esqueci a senha
      </Link>
    </AuthCard>
  );
}
