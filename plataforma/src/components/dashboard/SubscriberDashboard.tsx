import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  CreditCard,
  Flame,
  Lock,
  PlayCircle,
  Star,
  Trophy,
} from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import { Container } from "@portfolio/ui/Container";
import type { Viewer } from "@/lib/access";
import {
  formatDate,
  formatDateTime,
  formatDueDate,
  formatMoney,
  formatStudyTime,
} from "@/lib/format";
import type { StudentArea, StudentDashboard } from "@/lib/student-area";
import {
  AccountCard,
  card,
  CardTitle,
  ContinueLink,
  DashboardHeader,
  Notice,
  ProgressBar,
  RecentAttempts,
  RecentLessons,
  StatTile,
  StudyCalendar,
  WeekStrip,
} from "@/components/dashboard/DashboardParts";

const SUBSCRIPTION_STATUS: Record<string, string> = {
  active: "Ativa",
  past_due: "Pagamento em atraso",
  canceled: "Cancelada (acesso até o fim do período)",
};

const ACHIEVEMENT_ICONS = { first: Star, streak: Flame, course: Award } as const;

/** Aviso de fim da cortesia: a partir de 7 dias antes. */
const COURTESY_WARNING_DAYS = 7;

/**
 * Painel completo de quem assina (ou tem cortesia): avisos, continuar de onde
 * parou, sequência de estudo, números de desempenho, disciplinas com a
 * próxima aula e as atividades, atividades para fazer e recentes, calendário
 * de 4 semanas, assinatura, conquistas e conta.
 */
export function SubscriberDashboard({
  viewer,
  area,
  dashboard,
}: {
  viewer: Viewer;
  area: StudentArea;
  dashboard: StudentDashboard;
}) {
  const subscription = area.subscription;
  if (!subscription) return null;
  const isCourtesy = subscription.gateway === "manual";
  const subscribedIds = subscription.courses.map((c) => c.course.id);
  const progressById = new Map(dashboard.courseProgress.map((c) => [c.id, c]));
  const otherCourses = dashboard.courseProgress.filter((c) => !subscribedIds.includes(c.id));
  const activitiesDone = dashboard.activitiesTotal - dashboard.pendingActivities.length;
  const freeSlots = Math.max(0, area.maxCourses - subscription.courses.length);

  return (
    <Container className="py-10">
      <DashboardHeader
        name={viewer.name}
        badge={<Badge tone="accent">{isCourtesy ? "cortesia" : subscription.plan.name}</Badge>}
        subtitle={
          subscription.currentPeriodEnd
            ? `Acesso completo até ${formatDate(subscription.currentPeriodEnd)} · ${subscription.courses.length} disciplina(s) na assinatura`
            : `${subscription.courses.length} disciplina(s) na assinatura`
        }
      />

      {subscription.status === "past_due" ? (
        <Notice tone="warning">
          O pagamento da assinatura está atrasado. Pague a fatura para não perder o acesso às aulas
          das suas disciplinas.{" "}
          <a href="#assinatura" className="text-accent underline-offset-2 hover:underline">
            Ver a assinatura
          </a>
        </Notice>
      ) : null}
      {subscription.status === "canceled" && subscription.currentPeriodEnd ? (
        <Notice>
          Assinatura cancelada: o acesso continua até {formatDate(subscription.currentPeriodEnd)}.
          Depois, ficam abertas as aulas grátis.
        </Notice>
      ) : null}
      {isCourtesy &&
      subscription.status !== "canceled" &&
      area.daysLeft !== null &&
      area.daysLeft <= COURTESY_WARNING_DAYS &&
      subscription.currentPeriodEnd ? (
        <Notice>
          Sua cortesia termina em {area.daysLeft} dia(s), em{" "}
          {formatDate(subscription.currentPeriodEnd)}. Depois, ficam abertas as aulas grátis;{" "}
          <Link href="/assinar" className="text-accent underline-offset-2 hover:underline">
            assine para continuar com tudo
          </Link>
          .
        </Notice>
      ) : null}

      {/* Continuar + semana */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section aria-labelledby="continuar" className={`${card} flex flex-col gap-4`}>
          <CardTitle id="continuar" icon={PlayCircle}>
            Continuar de onde parou
          </CardTitle>
          {dashboard.continueLesson ? (
            <ContinueLink lesson={dashboard.continueLesson} eyebrow="Última aula aberta" />
          ) : dashboard.suggestedLesson ? (
            <ContinueLink lesson={dashboard.suggestedLesson} eyebrow="Próxima aula" />
          ) : (
            <p className="text-muted text-sm">
              Você concluiu todas as aulas publicadas das suas disciplinas. Novas aulas aparecem
              aqui assim que forem publicadas.
            </p>
          )}
          <RecentLessons lessons={dashboard.recentLessons} />
        </section>

        <section aria-labelledby="semana" className={`${card} flex flex-col`}>
          <CardTitle id="semana" icon={Flame}>
            Sua sequência
          </CardTitle>
          <p className="mt-4 flex items-baseline gap-2">
            <span className="text-accent text-5xl font-bold tabular-nums">{dashboard.streak}</span>
            <span className="text-muted">dia(s) seguido(s) de estudo</span>
          </p>
          <p className="text-muted mt-2 text-sm">
            {dashboard.streak
              ? "Estude um pouco hoje para manter a sequência."
              : "Abra uma aula ou faça uma atividade hoje para começar uma sequência."}
          </p>
          <div className="mt-auto pt-5">
            <WeekStrip days={dashboard.studyDays} />
          </div>
        </section>
      </div>

      {/* Números */}
      <ul aria-label="Seu desempenho" className="my-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={CheckCircle2}
          value={`${dashboard.subscribedLessonsDone} de ${dashboard.subscribedLessonsTotal}`}
          label="aula(s) concluída(s)"
          detail="nas suas disciplinas"
        />
        <StatTile
          icon={Clock}
          value={formatStudyTime(dashboard.completedSeconds)}
          label="de aula concluída"
          detail="soma dos vídeos concluídos"
        />
        <StatTile
          icon={ClipboardList}
          value={dashboard.averagePercent === null ? "—" : `${dashboard.averagePercent}%`}
          label="média de acertos"
          detail={`${dashboard.attemptsCount} envio(s)`}
        />
        <StatTile
          icon={ClipboardCheck}
          value={`${activitiesDone} de ${dashboard.activitiesTotal}`}
          label="atividade(s) feita(s)"
          detail="nas suas disciplinas"
        />
      </ul>

      {/* Disciplinas */}
      <section
        id="disciplinas"
        aria-labelledby="disciplinas-titulo"
        className={`${card} scroll-mt-24`}
      >
        <CardTitle id="disciplinas-titulo" icon={BookOpen}>
          Minhas disciplinas
        </CardTitle>
        <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subscription.courses.map(({ slotNumber, course }) => {
            const progress = progressById.get(course.id);
            return (
              <li
                key={slotNumber}
                className="rounded-btn border-border bg-surface-2 flex flex-col gap-4 border p-4"
              >
                <Link
                  href={`/disciplina/${course.slug}`}
                  className="hover:text-accent flex items-center gap-3 font-semibold transition-colors"
                >
                  <BookOpen className="text-accent size-5 shrink-0" aria-hidden />
                  {course.title}
                </Link>
                {progress ? (
                  <>
                    <ProgressBar
                      done={progress.done}
                      total={progress.total}
                      label="Aulas"
                      name={course.title}
                    />
                    <p className="text-muted text-sm">
                      Atividades: {progress.activitiesDone} de {progress.activitiesTotal}
                    </p>
                    {progress.nextLesson ? (
                      <Link
                        href={progress.nextLesson.href}
                        className="text-accent mt-auto flex items-center gap-2 text-sm font-medium underline-offset-2 hover:underline"
                      >
                        <PlayCircle className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">Próxima: {progress.nextLesson.title}</span>
                      </Link>
                    ) : (
                      <p className="text-success mt-auto flex items-center gap-2 text-sm">
                        <CheckCircle2 className="size-4" aria-hidden /> Todas as aulas concluídas
                      </p>
                    )}
                  </>
                ) : null}
              </li>
            );
          })}
          {Array.from({ length: freeSlots }).map((_, index) => (
            <li
              key={`vaga-${index}`}
              className="rounded-btn border-border text-muted flex items-center justify-center border border-dashed p-4 text-center text-sm"
            >
              Vaga livre (a escolha das disciplinas chega com a assinatura online)
            </li>
          ))}
        </ul>
        {otherCourses.length ? (
          <div className="mt-6 flex flex-col gap-4">
            <h3 className="text-muted text-sm font-medium">Outras disciplinas que você começou</h3>
            {otherCourses.map((c) => (
              <Link key={c.id} href={`/disciplina/${c.slug}`} className="hover:text-accent">
                <ProgressBar done={c.done} total={c.total} label={c.title} />
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Atividades para fazer */}
        <section aria-labelledby="para-fazer" className={card}>
          <CardTitle id="para-fazer" icon={ClipboardCheck}>
            Atividades para fazer
          </CardTitle>
          {dashboard.pendingActivities.length ? (
            <>
              <ul className="divide-border mt-3 flex flex-col divide-y">
                {dashboard.pendingActivities.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/atividades/${a.id}`}
                      className="hover:text-accent flex items-center gap-3 py-2.5 text-sm transition-colors"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{a.title}</span>
                        <span className="text-muted block truncate text-xs">
                          {a.course} · {a.module}
                        </span>
                      </span>
                      <Badge tone="accent">fazer</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
              {dashboard.pendingActivities.length > 5 ? (
                <p className="text-muted mt-2 text-xs">
                  e mais {dashboard.pendingActivities.length - 5} atividade(s) nas suas disciplinas.
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-muted mt-3 text-sm">
              Nenhuma atividade pendente nas suas disciplinas. Muito bem!
            </p>
          )}
        </section>

        <section aria-labelledby="atividades" className={card}>
          <CardTitle id="atividades" icon={ClipboardList}>
            Atividades recentes
          </CardTitle>
          <RecentAttempts dashboard={dashboard} />
        </section>

        {/* Calendário */}
        <section aria-labelledby="calendario" className={card}>
          <CardTitle id="calendario" icon={CalendarDays}>
            Últimas 4 semanas
          </CardTitle>
          <p className="text-muted mt-1 mb-4 text-sm">
            Cada quadrado é um dia; mais forte = mais estudo (aulas, vídeos e atividades).
          </p>
          <StudyCalendar days={dashboard.studyCalendar} />
        </section>

        {/* Assinatura */}
        <section
          id="assinatura"
          aria-labelledby="assinatura-titulo"
          className={`${card} scroll-mt-24`}
        >
          <CardTitle id="assinatura-titulo" icon={CreditCard}>
            Assinatura
          </CardTitle>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
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
            <div>
              <dt className="text-muted">Vagas</dt>
              <dd>
                {subscription.courses.length} de {area.maxCourses} em uso
              </dd>
            </div>
          </dl>
        </section>

        {/* Conquistas */}
        <section aria-labelledby="conquistas" className={`${card} lg:col-span-2`}>
          <CardTitle id="conquistas" icon={Trophy}>
            Conquistas
          </CardTitle>
          <ul className="mt-4 grid grid-cols-3 gap-3" aria-label="Conquistas">
            {dashboard.achievements.map((a) => {
              const Icon = ACHIEVEMENT_ICONS[a.key as keyof typeof ACHIEVEMENT_ICONS] ?? Star;
              return (
                <li
                  key={a.key}
                  aria-label={`${a.label}: ${a.unlocked ? "conquistada" : "ainda não"}`}
                  className={`rounded-btn flex flex-col items-center gap-2 border p-3 text-center text-xs ${
                    a.unlocked
                      ? "border-accent/50 bg-accent/10 text-text"
                      : "border-border text-muted border-dashed opacity-70"
                  }`}
                >
                  {a.unlocked ? (
                    <Icon className="text-accent size-6" aria-hidden />
                  ) : (
                    <Lock className="size-6" aria-hidden />
                  )}
                  {a.label}
                </li>
              );
            })}
          </ul>
        </section>

        <AccountCard viewer={viewer} area={area} />
      </div>
    </Container>
  );
}
