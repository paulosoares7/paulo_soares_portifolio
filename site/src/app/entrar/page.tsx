import type { Metadata } from "next";
import { KeyRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, PageTitle } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Entrar", robots: { index: false } };

/**
 * Entrar — versão provisória da fase 3. A entrada com o código
 * XXXX-XXXX-XXXX-XXXX e a minha área chegam na fase 4 (RF13–RF15).
 */
export default function SignInPage() {
  return (
    <Container>
      <PageTitle title="Minha" accent="área" />
      <section className="rounded-card border-border bg-surface flex max-w-xl flex-col gap-4 border p-6 sm:p-8">
        <KeyRound className="text-accent size-8" aria-hidden />
        <p className="font-semibold">
          A entrada com código de acesso abre junto com as assinaturas.
        </p>
        <p className="text-muted text-sm">
          Até lá, as aulas grátis de cada disciplina estão abertas, sem cadastro.
        </p>
        <div>
          <ButtonLink href="/aulas">Ver aulas</ButtonLink>
        </div>
      </section>
    </Container>
  );
}
