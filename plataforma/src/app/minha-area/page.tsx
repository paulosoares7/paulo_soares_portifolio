import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import { ButtonLink } from "@portfolio/ui/Button";
import { Container, PageTitle } from "@portfolio/ui/Container";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getViewer } from "@/lib/access";
import { MAX_SESSIONS } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { loginUrl } from "@/lib/safe-next";
import { getStudentArea } from "@/lib/student-area";

export const metadata: Metadata = { title: "Minha área", robots: { index: false } };

/**
 * Minha área (versão inicial): conta, formas de entrar, disciplinas da
 * assinatura e sair. Cobrança, troca de disciplina e progresso chegam na
 * fase 4 (RF15, RF16).
 */
export default async function StudentAreaPage() {
  const viewer = await getViewer();
  if (!viewer) redirect(loginUrl("/minha-area"));
  const { signInMethods, openSessions, subscription } = await getStudentArea(viewer.id);
  const methods = [
    signInMethods.google ? "Google" : null,
    signInMethods.password ? "e-mail e senha" : null,
  ].filter(Boolean);

  return (
    <Container>
      <PageTitle title="Minha" accent="área" description={`Olá, ${viewer.name.split(" ")[0]}!`} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section
          aria-labelledby="disciplinas"
          className="rounded-card border-border bg-surface border p-6"
        >
          <h2 id="disciplinas" className="text-xl font-semibold">
            Minhas disciplinas
          </h2>
          {subscription ? (
            <>
              <p className="text-muted mt-1 flex flex-wrap items-center gap-2 text-sm">
                {subscription.plan.name}
                {subscription.gateway === "manual" ? <Badge tone="accent">cortesia</Badge> : null}
                {subscription.currentPeriodEnd
                  ? `· acesso até ${formatDateTime(subscription.currentPeriodEnd)}`
                  : null}
              </p>
              <ul className="mt-5 flex flex-col gap-3">
                {subscription.courses.map(({ slotNumber, course }) => (
                  <li key={slotNumber}>
                    <Link
                      href={`/disciplina/${course.slug}`}
                      className="rounded-btn border-border bg-surface-2 hover:border-accent/60 flex items-center justify-between gap-3 border p-4 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <BookOpen className="text-accent size-5" aria-hidden />
                        <span className="font-medium">{course.title}</span>
                      </span>
                      <ArrowRight className="text-muted size-4" aria-hidden />
                    </Link>
                  </li>
                ))}
                {Array.from({
                  length: Math.max(0, subscription.plan.maxCourses - subscription.courses.length),
                }).map((_, index) => (
                  <li
                    key={`vaga-${index}`}
                    className="rounded-btn border-border text-muted border border-dashed p-4 text-sm"
                  >
                    Vaga livre (a escolha das disciplinas chega com a assinatura online)
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mt-4 flex flex-col items-start gap-4">
              <p className="text-muted text-sm">
                Você ainda não tem assinatura. As aulas grátis de cada disciplina já estão abertas.
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/assinar">Ver a assinatura</ButtonLink>
                <ButtonLink href="/aulas" variant="outline">
                  Ver aulas grátis
                </ButtonLink>
              </div>
            </div>
          )}
        </section>

        <section
          aria-labelledby="conta"
          className="rounded-card border-border bg-surface border p-6"
        >
          <h2 id="conta" className="text-xl font-semibold">
            Minha conta
          </h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-muted">Nome</dt>
              <dd>{viewer.name}</dd>
            </div>
            <div>
              <dt className="text-muted">E-mail</dt>
              <dd className="break-all">{viewer.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Entra com</dt>
              <dd>{methods.join(" e ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Aparelhos conectados</dt>
              <dd>
                {openSessions} de {MAX_SESSIONS} (ao entrar num 3º, o mais antigo sai)
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <SignOutButton />
            {!signInMethods.password ? (
              <ButtonLink href="/esqueci-a-senha" variant="ghost">
                Criar senha
              </ButtonLink>
            ) : null}
          </div>
        </section>
      </div>
    </Container>
  );
}
