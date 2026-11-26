import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { Container, PageTitle } from "@/components/ui/Container";
import { getActivePlan } from "@/lib/catalog";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Assinar",
  description: "Assinatura mensal com até 3 disciplinas de Física.",
};

/**
 * Assinar — versão informativa da fase 3. O pagamento pelo Asaas, o código
 * de acesso e a escolha das disciplinas chegam na fase 4 (RF09–RF11).
 */
export default async function SubscribePage() {
  const plan = await getActivePlan();
  return (
    <Container>
      <PageTitle
        title="Assinatura"
        accent="mensal"
        description="Acesso a todas as aulas, atividades e materiais das disciplinas que você escolher."
      />
      <section className="rounded-card border-accent/40 bg-surface max-w-xl border p-6 sm:p-8">
        {plan ? (
          <>
            <p className="text-accent text-sm font-semibold tracking-wide uppercase">{plan.name}</p>
            <p className="mt-2 text-4xl font-bold">
              {formatMoney(plan.priceCents)}{" "}
              <span className="text-muted text-base font-normal">/ mês</span>
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-sm">
              {[
                `Até ${plan.maxCourses} disciplinas à sua escolha`,
                "Troca de uma disciplina por ciclo, valendo na renovação",
                "Videoaulas, atividades com correção e materiais",
                "Pix, Pix Automático ou cartão; cancele quando quiser",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="text-success size-5 shrink-0" aria-hidden /> {item}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="rounded-btn border-warning/40 bg-warning/10 text-warning mt-6 border p-3 text-sm">
          As assinaturas abrem em breve. Enquanto isso, assista às aulas grátis ou fale comigo.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/aulas">Ver aulas grátis</ButtonLink>
          <ButtonLink href="/contato" variant="outline">
            Fale comigo
          </ButtonLink>
        </div>
      </section>
    </Container>
  );
}
