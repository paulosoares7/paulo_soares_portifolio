import Link from "next/link";
import { Check, CheckCircle2, ClipboardList, PlayCircle, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import { ButtonLink } from "@portfolio/ui/Button";
import { Container } from "@portfolio/ui/Container";
import type { Viewer } from "@/lib/access";
import { formatMoney } from "@/lib/format";
import type { FreeLessonItem } from "@/lib/home";
import type { StudentArea, StudentDashboard } from "@/lib/student-area";
import {
  AccountCard,
  card,
  CardTitle,
  ContinueLink,
  DashboardHeader,
  ProgressBar,
  RecentAttempts,
  RecentLessons,
  WeekStrip,
} from "@/components/dashboard/DashboardParts";

/**
 * Painel simples de quem não assina: chamada para assinar com o preço do
 * plano, continuar de onde parou (ou boas-vindas com as aulas grátis), o
 * progresso no conteúdo grátis e a conta.
 */
export function FreeDashboard({
  viewer,
  area,
  dashboard,
  plan,
  freeLessons,
}: {
  viewer: Viewer;
  area: StudentArea;
  dashboard: StudentDashboard;
  plan: { priceCents: number; maxCourses: number } | null;
  freeLessons: FreeLessonItem[];
}) {
  const studiedDays = dashboard.studyDays.filter((d) => d.count > 0).length;

  return (
    <Container className="py-10">
      <DashboardHeader
        name={viewer.name}
        badge={<Badge>versão gratuita</Badge>}
        subtitle="As aulas grátis de cada disciplina estão abertas para você."
      />

      {/* Chamada para assinar */}
      <section
        id="assinatura"
        aria-labelledby="assinar-titulo"
        className="rounded-card border-accent/40 from-accent/10 to-surface mb-6 grid scroll-mt-24 gap-6 border bg-gradient-to-br p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center"
      >
        <div>
          <h2 id="assinar-titulo" className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="text-accent size-6" aria-hidden /> Libere todas as aulas
          </h2>
          <p className="text-muted mt-2">
            {plan
              ? `Assinatura de ${formatMoney(plan.priceCents)} por mês, com até ${plan.maxCourses} disciplinas à sua escolha.`
              : "Com a assinatura, você escolhe as suas disciplinas e libera tudo delas."}
          </p>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {[
              "Todas as aulas das suas disciplinas",
              "Atividades com correção na hora",
              "Materiais de apoio",
              "Painel completo de desempenho",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="text-accent size-4 shrink-0" aria-hidden /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          {plan ? (
            <p className="text-3xl font-bold">
              {formatMoney(plan.priceCents)}
              <span className="text-muted text-base font-normal">/mês</span>
            </p>
          ) : null}
          <ButtonLink href="/assinar">Quero assinar</ButtonLink>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="continuar" className={`${card} flex flex-col gap-4`}>
          <CardTitle id="continuar" icon={PlayCircle}>
            {dashboard.continueLesson ? "Continuar de onde parou" : "Comece por aqui"}
          </CardTitle>
          {dashboard.continueLesson ? (
            <ContinueLink lesson={dashboard.continueLesson} eyebrow="Última aula aberta" />
          ) : (
            <p className="text-sm">
              {dashboard.hasHistory ? null : <strong>Boas-vindas! </strong>}
              <span className="text-muted">
                {dashboard.hasHistory
                  ? "Escolha a próxima aula grátis:"
                  : "Você ainda não começou nenhuma aula. Comece por uma aula grátis:"}
              </span>
            </p>
          )}
          {freeLessons.length ? (
            <div>
              <h3 className="text-muted mb-2 text-sm font-medium">Aulas grátis</h3>
              <ul aria-label="Aulas grátis" className="flex flex-col gap-2">
                {freeLessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={l.href}
                      className="rounded-btn border-border bg-surface-2 hover:border-accent/60 flex items-center gap-3 border p-3 text-sm transition-colors"
                    >
                      <PlayCircle className="text-accent size-5 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{l.title}</span>
                      <span className="text-muted hidden shrink-0 text-xs sm:inline">
                        {l.courseTitle}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <RecentLessons lessons={dashboard.recentLessons} />
          <ButtonLink href="/aulas" variant="outline" className="self-start">
            Ver todas as aulas
          </ButtonLink>
        </section>

        <section
          id="disciplinas"
          aria-labelledby="progresso"
          className={`${card} flex scroll-mt-24 flex-col gap-5`}
        >
          <CardTitle id="progresso" icon={TrendingUp}>
            Seu progresso
          </CardTitle>
          <ul aria-label="Seu desempenho" className="grid grid-cols-2 gap-3 text-sm">
            <li className="rounded-btn bg-surface-2 p-3">
              <CheckCircle2 className="text-accent size-4" aria-hidden />
              <span className="mt-1 block text-xl font-bold tabular-nums">
                {dashboard.completedCount}
              </span>
              <span className="text-muted">aula(s) concluída(s)</span>
            </li>
            <li className="rounded-btn bg-surface-2 p-3">
              <ClipboardList className="text-accent size-4" aria-hidden />
              <span className="mt-1 block text-xl font-bold tabular-nums">
                {dashboard.averagePercent === null ? "—" : `${dashboard.averagePercent}%`}
              </span>
              <span className="text-muted">média em {dashboard.attemptsCount} atividade(s)</span>
            </li>
          </ul>
          <div>
            <p className="text-sm">
              <strong className="tabular-nums">{studiedDays} de 7</strong>{" "}
              <span className="text-muted">dias de estudo na semana</span>
            </p>
            <WeekStrip days={dashboard.studyDays} />
          </div>
          {dashboard.courseProgress.length ? (
            <div className="flex flex-col gap-4">
              <h3 className="text-muted text-sm font-medium">Disciplinas que você começou</h3>
              {dashboard.courseProgress.map((c) => (
                <Link key={c.id} href={`/disciplina/${c.slug}`} className="hover:text-accent">
                  <ProgressBar done={c.done} total={c.total} label={c.title} />
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        {dashboard.attemptsCount ? (
          <section aria-labelledby="atividades" className={`${card} lg:col-span-2`}>
            <CardTitle id="atividades" icon={ClipboardList}>
              Atividades recentes
            </CardTitle>
            <RecentAttempts dashboard={dashboard} />
          </section>
        ) : null}

        <AccountCard viewer={viewer} area={area} />
      </div>
    </Container>
  );
}
