import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthFields";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Esqueci a senha", robots: { index: false } };

/** Pede o link de redefinição de senha (também cria a senha de quem só usa o Google). */
export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Esqueci a senha"
      description="Digite o e-mail da sua conta. Enviaremos um link para criar uma nova senha."
      footer={
        <Link href="/entrar" className="text-accent font-medium hover:underline">
          Voltar para Entrar
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
