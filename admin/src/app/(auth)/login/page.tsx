import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/forms/LoginForm";
import { getCurrentAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Entrar" };

/** Página de login (RF22). Quem já está logado vai direto para o resumo. */
export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="rounded-card border-border bg-surface w-full max-w-sm border p-8">
        <h1 className="text-2xl font-semibold">
          Painel<span className="text-accent">.</span>
        </h1>
        <p className="text-muted mt-1 mb-6 text-sm">
          Entre com seu e-mail e senha de administrador.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
