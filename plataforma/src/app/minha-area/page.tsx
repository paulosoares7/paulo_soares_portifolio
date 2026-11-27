import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CalendarCheck,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Flame,
  PlayCircle,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import { ButtonLink } from "@portfolio/ui/Button";
import { Container, PageTitle } from "@portfolio/ui/Container";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getViewer } from "@/lib/access";
import { MAX_SESSIONS } from "@/lib/auth";
import { formatDate, formatDateTime, formatDueDate, formatMoney } from "@/lib/format";
import { loginUrl } from "@/lib/safe-next";
import { getFreeLessons } from "@/lib/home";
import { getStudentArea, getStudentDashboard, STUDY_WINDOW_DAYS } from "@/lib/student-area";

export const metadata: Metadata = { title: "Meu painel", robots: { index: false } };

const card = "rounded-card border-border bg-surface border p-6";

const SUBSCRIPTION_STATUS: Record<string, string> = {
  active: "Ativa",
  past_due: "Pagamento em atraso",
  canceled: "Cancelada (acesso até o fim do período)",
};

/** Barra de progresso com o texto "3 de 10 aulas". */
function ProgressBar({
  done,
  total,
  label,
  name = label,
}: {
  done: number;
  total: number;
  label: string;
  /** Disciplina, para o leitor de tela ("Progresso em Física I"). */
  name?: string;
}) {
  const percent = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted text-xs tabular-nums">
          {done} de {total} aula(s) · {percent}%
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`Progresso em ${name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="bg-surface-2 h-2 overflow-hidden rounded-full"
      >
        <div
          className="bg-accent h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** Número de destaque do painel ("12 aulas concluídas"). */
function StatTile({
  icon: Icon,
  value,
  label,
  children,
}: {
  icon: typeof BookOpen;
  value: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <li className="rounded-card border-border bg-surface flex flex-col gap-1 border p-4">
      <Icon className="text-accent size-5" aria-hidden />
      <span className="mt-1 text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-muted text-sm">{label}</span>
      {children}
    </li>
  );
}

/**
 * Painel do aluno (/minha-area), a tela de início depois do login: avisos da
 * assinatura, números de desempenho, continuar de onde parou, aulas vistas por
 * último, progresso por disciplina, atividades recentes e média, assinatura
 * com a próxima cobrança, conquistas (em breve) e a conta. Vale para quem
 * assina e para quem não assina (que vê o conteúdo grátis e o convite).
 */
export default async function StudentAreaPage() {
  const viewer = await getViewer();
  if (!viewer) redirect(loginUrl("/minha-area"));
  const area = await getStudentArea(viewer.id);
  const { signInMethods, openSessions, subscription, maxCourses } = area;
  const subscribedIds = subscription?.courses.map((c) => c.course.id) ?? [];
  const dashboard = await getStudentDashboard(viewer.id, subscribedIds);
  const progressById = new Map(dashboard.courseProgress.map((c) => [c.id, c]));
  const otherCourses = dashboard.courseProgress.filter((c) => !subscribedIds.includes(c.id));
  const methods = [
    signInMethods.google ? "Google" : null,
    signInMethods.password ? "e-mail e senha" : null,
  ].filter(Boolean);
  const isCourtesy = subscription?.gateway === "manual";
  // Aluno novo: boas-vindas com as aulas grátis para começar.
  const starters = dashboard.hasHistory ? [] : await getFreeLessons();
  const studiedDays = dashboard.studyDays.filter((d) => d.studied).length;

  return (
    <Container>
      <PageTitle title="Meu" accent="painel" description={`Olá, ${viewer.name.split(" ")[0]}!`} />

      {subscription?.status === "past_due" ? (
        <p
          role="status"
          className="rounded-card border-warning/50 bg-warning/10 mb-6 flex items-start gap-3 border p-4 text-sm"
        >
          <AlertTriangle className="text-warning mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            O pagamento da assinatura está atrasado. Pague a fatura para não perder o acesso às
            aulas das suas disciplinas.{" "}
            <a href="#assinatura" className="text-accent underline-offset-2 hover:underline">
              Ver a assinatura
            </a>
          </span>
        </p>
      ) : null}
      {subscription?.status === "canceled" && subscription.currentPeriodEnd ? (
        <p
          role="status"
          className="rounded-card border-border bg-surface-2 mb-6 flex items-start gap-3 border p-4 text-sm"
        >
          <AlertTriangle className="text-muted mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            Assinatura cancelada: o acesso continua até {formatDate(subscription.currentPeriodEnd)}.
            Depois, ficam abertas as aulas grátis.
          </span>
        </p>
      ) : null}
      {!subscription ? (
        <aside
          aria-label="Convite para assinar"
          className="rounded-card border-accent/40 bg-accent/5 mb-6 flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-3 text-sm">
            <Sparkles className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
            <span>
              Você está na versão gratuita: as aulas grátis de cada disciplina estão abertas. Assine
              para liberar todas as aulas, atividades e materiais.
            </span>
          </p>
          <ButtonLink href="/assinar" className="shrink-0">
            Quero assinar
          </ButtonLink>
        </aside>
      ) : null}

      <ul aria-label="Seu desempenho" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={CheckCircle2}
          value={String(dashboard.completedCount)}
          label="aula(s) concluída(s)"
        />
        <StatTile
          icon={BookOpen}
          value={String(dashboard.courseProgress.length)}
          label="disciplina(s) em estudo"
        />
        <StatTile
          icon={ClipboardList}
          value={dashboard.averagePercent === null ? "—" : `${dashboard.averagePercent}%`}
          label={`média de acertos · ${dashboard.attemptsCount} atividade(s)`}
        />
        <StatTile
          icon={CalendarCheck}
          value={`${studiedDays} de ${STUDY_WINDOW_DAYS}`}
          label="dias de estudo na semana"
        >
          <ol className="mt-2 flex gap-1" aria-label="Dias de estudo nos últimos 7 dias">
            {dashboard.studyDays.map((day) => (
              <li
                key={day.key}
                className="flex flex-1 flex-col items-center gap-1"
                aria-label={`${day.label}: ${day.studied ? "estudou" : "sem estudo"}`}
              >
                <span
                  aria-hidden
                  className={`h-2 w-full rounded-full ${day.studied ? "bg-accent" : "bg-border"}`}
                />
                <span aria-hidden className="text-muted text-[10px]">
                  {day.label}
                </span>
              </li>
            ))}
          </ol>
        </StatTile>
      </ul>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="continuar" className={`${card} flex flex-col gap-4`}>
          <h2 id="continuar" className="text-xl font-semibold">
            Continuar de onde parou
          </h2>
          {dashboard.continueLesson ? (
            <Link
              href={dashboard.continueLesson.href}
              className="group rounded-btn border-accent/40 bg-accent/5 hover:border-accent flex items-center gap-4 border p-4 transition-colors"
            >
              <PlayCircle className="text-accent size-10 shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">
                  {dashboard.continueLesson.title}
                </span>
                <span className="text-muted block truncate text-sm">
                  {dashboard.continueLesson.course} · {dashboard.continueLesson.module}
                </span>
              </span>
              <ArrowRight
                className="text-accent size-5 shrink-0 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm">
                <strong>Boas-vindas!</strong>{" "}
                <span className="text-muted">
                  Você ainda não começou nenhuma aula. Comece por uma aula grátis:
                </span>
              </p>
              {starters.length ? (
                <ul aria-label="Comece por aqui" className="flex w-full flex-col gap-2">
                  {starters.map((l) => (
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
              ) : null}
              <ButtonLink href="/aulas" variant="outline">
                Ver todas as aulas
              </ButtonLink>
            </div>
          )}

          {dashboard.recentLessons.length ? (
            <div>
              <h3 className="text-muted mb-2 text-sm font-medium">Assistidas por último</h3>
              <ul className="divide-border flex flex-col divide-y">
                {dashboard.recentLessons.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={l.href}
                      className="hover:text-accent flex items-center gap-3 py-2.5 text-sm transition-colors"
                    >
                      {l.completed ? (
                        <CheckCircle2
                          className="text-success size-4 shrink-0"
                          aria-label="Concluída"
                        />
                      ) : (
                        <PlayCircle
                          className="text-muted size-4 shrink-0"
                          aria-label="Em andamento"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate">{l.title}</span>
                      <span className="text-muted hidden shrink-0 text-xs sm:inline">
                        {l.course} · {formatDate(l.updatedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section
          id="assinatura"
          aria-labelledby="assinatura-titulo"
          className={`${card} scroll-mt-24`}
        >
          <h2 id="assinatura-titulo" className="flex items-center gap-2 text-xl font-semibold">
            <CreditCard className="text-accent size-5" aria-hidden /> Assinatura
          </h2>
          {subscription ? (
            <dl className="mt-4 flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-muted">Plano</dt>
                <dd className="flex flex-wrap items-center gap-2">
                  {subscription.plan.name}
                  {isCourtesy ? <Badge tone="accent">cortesia</Badge> : null}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Situação</dt>
                <dd>
                  <Badge tone={subscription.status === "past_due" ? "warning" : "success"}>
                    {SUBSCRIPTION_STATUS[subscription.status] ?? subscription.status}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted">Acesso até</dt>
                <dd>
                  {subscription.currentPeriodEnd
                    ? formatDateTime(subscription.currentPeriodEnd)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Próxima cobrança</dt>
                <dd>
                  {isCourtesy ? (
                    "Sem cobrança (cortesia)"
                  ) : dashboard.nextPayment ? (
                    <span className="flex flex-wrap items-center gap-2">
                      {formatMoney(dashboard.nextPayment.amountCents)} em{" "}
                      {formatDueDate(dashboard.nextPayment.dueDate)}
                      {dashboard.nextPayment.status === "overdue" ? (
                        <Badge tone="warning">vencida</Badge>
                      ) : null}
                      {dashboard.nextPayment.invoiceUrl ? (
                        <a
                          href={dashboard.nextPayment.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent underline-offset-2 hover:underline"
                        >
                          Ver fatura
                        </a>
                      ) : null}
                    </span>
                  ) : subscription.status === "active" && subscription.currentPeriodEnd ? (
                    `Renova em ${formatDate(subscription.currentPeriodEnd)}`
                  ) : (
                    "Nenhuma"
                  )}
                </dd>
              </div>
            </dl>
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
          id="disciplinas"
          aria-labelledby="disciplinas-titulo"
          className={`${card} scroll-mt-24`}
        >
          <h2 id="disciplinas-titulo" className="text-xl font-semibold">
            Minhas disciplinas
          </h2>
          {subscription ? (
            <ul className="mt-5 flex flex-col gap-3">
              {subscription.courses.map(({ slotNumber, course }) => {
                const progress = progressById.get(course.id);
                return (
                  <li key={slotNumber}>
                    <Link
                      href={`/disciplina/${course.slug}`}
                      className="rounded-btn border-border bg-surface-2 hover:border-accent/60 flex flex-col gap-3 border p-4 transition-colors"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-3">
                          <BookOpen className="text-accent size-5" aria-hidden />
                          <span className="font-medium">{course.title}</span>
                        </span>
                        <ArrowRight className="text-muted size-4" aria-hidden />
                      </span>
                      {progress ? (
                        <ProgressBar
                          done={progress.done}
                          total={progress.total}
                          label="Progresso"
                          name={course.title}
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
              {Array.from({ length: Math.max(0, maxCourses - subscription.courses.length) }).map(
                (_, index) => (
                  <li
                    key={`vaga-${index}`}
                    className="rounded-btn border-border text-muted border border-dashed p-4 text-sm"
                  >
                    Vaga livre (a escolha das disciplinas chega com a assinatura online)
                  </li>
                ),
              )}
            </ul>
          ) : (
            <p className="text-muted mt-3 text-sm">
              Com a assinatura, você escolhe {maxCourses || "as"} disciplinas para estudar.
            </p>
          )}
          {otherCourses.length ? (
            <div className="mt-6 flex flex-col gap-4">
              <h3 className="text-muted text-sm font-medium">
                Outras disciplinas que você começou
              </h3>
              {otherCourses.map((c) => (
                <Link key={c.id} href={`/disciplina/${c.slug}`} className="hover:text-accent">
                  <ProgressBar done={c.done} total={c.total} label={c.title} />
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section aria-labelledby="atividades" className={card}>
          <h2 id="atividades" className="flex items-center gap-2 text-xl font-semibold">
            <ClipboardList className="text-accent size-5" aria-hidden /> Atividades recentes
          </h2>
          <p className="text-muted mt-1 text-sm">
            {dashboard.attemptsCount
              ? `${dashboard.attemptsCount} enviada(s)${
                  dashboard.averagePercent === null
                    ? ""
                    : ` · média ${dashboard.averagePercent}% de acerto`
                }`
              : "Nenhuma atividade enviada ainda."}
          </p>
          {dashboard.recentAttempts.length ? (
            <ul className="divide-border mt-3 flex flex-col divide-y">
              {dashboard.recentAttempts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/atividades/${a.activityId}`}
                    className="hover:text-accent flex items-center gap-3 py-2.5 text-sm transition-colors"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{a.title}</span>
                      <span className="text-muted block truncate text-xs">
                        {a.course}
                        {a.submittedAt ? ` · ${formatDate(a.submittedAt)}` : ""}
                      </span>
                    </span>
                    {a.percent === null ? (
                      <Badge>aguardando correção</Badge>
                    ) : (
                      <Badge
                        tone={a.percent >= 70 ? "success" : a.percent >= 50 ? "warning" : "danger"}
                      >
                        {a.percent}%
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section aria-labelledby="conquistas" className={card}>
          <h2 id="conquistas" className="flex items-center gap-2 text-xl font-semibold">
            <Trophy className="text-accent size-5" aria-hidden /> Conquistas
          </h2>
          <p className="text-muted mt-1 text-sm">
            Em breve: selos por aulas concluídas e sequência de estudo.
          </p>
          <ul className="mt-4 grid grid-cols-3 gap-3" aria-label="Conquistas (em breve)">
            {[
              { icon: Star, label: "Primeira aula" },
              { icon: Flame, label: "7 dias seguidos" },
              { icon: Award, label: "Disciplina completa" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="rounded-btn border-border text-muted flex flex-col items-center gap-2 border border-dashed p-3 text-center text-xs opacity-70"
              >
                <Icon className="size-6" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="conta" className={`${card} lg:col-span-2`}>
          <h2 id="conta" className="text-xl font-semibold">
            Minha conta
          </h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
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
