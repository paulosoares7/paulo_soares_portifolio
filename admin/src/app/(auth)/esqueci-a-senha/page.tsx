import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";
import { AuthCard } from "@/components/layout/AuthCard";

export const metadata: Metadata = { title: "Esqueci a senha" };

/** Pede o link para criar uma nova senha do painel. */
export default function ForgotPasswordPage() {
  return (
    <AuthCard description="Digite o e-mail de administrador. Enviaremos um link para criar uma nova senha.">
      <ForgotPasswordForm />
      <Link href="/login" className="text-accent mt-6 block text-center text-sm hover:underline">
        Voltar para o login
      </Link>
    </AuthCard>
  );
}
