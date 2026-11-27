// Peças do painel do aluno, comuns ao painel gratuito e ao do assinante.
// Só desenham: os dados chegam prontos de lib/student-area.ts.
import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, PlayCircle, type LucideIcon } from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import { ButtonLink } from "@portfolio/ui/Button";
import { SignOutButton } from "@/components/auth/SignOutButton";
import type { Viewer } from "@/lib/access";
import { MAX_SESSIONS } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { DashboardLesson, StudentArea, StudentDashboard, StudyDay } from "@/lib/student-area";

/** Classe do cartão do painel. */
export const card = "rounded-card border-border bg-surface border p-6";

/** Título do cartão com ícone. */
export function CardTitle({
  id,
  icon: Icon,
  children,
}: {
  id: string;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <h2 id={id} className="flex items-center gap-2 text-xl font-semibold">
      {Icon ? <Icon className="text-accent size-5" aria-hidden /> : null}
      {children}
    </h2>
  );
}

/** Barra de progresso com o texto "3 de 10 aulas". */
export function ProgressBar({
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

/** Número de destaque ("12 aulas concluídas"). */
export function StatTile({
  icon: Icon,
  value,
  label,
  detail,
  children,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <li className="rounded-card border-border bg-surface flex flex-col gap-1 border p-4">
      <Icon className="text-accent size-5" aria-hidden />
      <span className="mt-1 text-2xl font-bold tabular-nums">{value}</span>
      <span className="text-muted text-sm">{label}</span>
      {detail ? <span className="text-muted text-xs">{detail}</span> : null}
      {children}
    </li>
  );
}

/** Faixa dos últimos 7 dias: preenchido = dia com estudo. */
export function WeekStrip({ days }: { days: StudyDay[] }) {
  return (
    <ol className="mt-2 flex gap-1" aria-label="Dias de estudo nos últimos 7 dias">
      {days.map((day) => (
        <li
          key={day.key}
          className="flex flex-1 flex-col items-center gap-1"
          aria-label={`${day.label}, ${day.date}: ${day.count ? "estudou" : "sem estudo"}`}
        >
          <span
            aria-hidden
            className={`h-2 w-full rounded-full ${day.count ? "bg-accent" : "bg-border"}`}
          />
          <span aria-hidden className="text-muted text-[10px]">
            {day.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * Intensidade do dia no calendário (uma cor só, do fraco ao forte).
 * @param count Coisas feitas no dia.
 * @returns Classe de fundo.
 */
function calendarShade(count: number): string {
  if (count === 0) return "bg-border";
  if (count === 1) return "bg-accent/35";
  if (count <= 3) return "bg-accent/65";
  return "bg-accent";
}

/** Calendário das últimas 4 semanas (7 colunas, hoje no fim). */
export function StudyCalendar({ days }: { days: StudyDay[] }) {
  return (
    <div className="max-w-xs">
      <div className="text-muted grid grid-cols-7 gap-1.5 text-center text-[10px]" aria-hidden>
        {days.slice(0, 7).map((d) => (
          <span key={d.key}>{d.label}</span>
        ))}
      </div>
      <ol
        className="mt-1.5 grid grid-cols-7 gap-1.5"
        aria-label={`Estudo nos últimos ${days.length} dias`}
      >
        {days.map((day, index) => {
          const text = `${day.date}: ${day.count ? `${day.count} registro(s) de estudo` : "sem estudo"}`;
          return (
            <li
              key={day.key}
              title={text}
              aria-label={text}
              className={`aspect-square rounded-sm ${calendarShade(day.count)} ${
                index === days.length - 1
                  ? "ring-accent ring-offset-surface ring-2 ring-offset-2"
                  : ""
              }`}
            />
          );
        })}
      </ol>
      <div
        className="text-muted mt-3 flex items-center justify-end gap-1.5 text-[11px]"
        aria-hidden
      >
        menos
        {[0, 1, 2, 4].map((n) => (
          <span key={n} className={`size-3 rounded-sm ${calendarShade(n)}`} />
        ))}
        mais
      </div>
    </div>
  );
}

/** Cartão grande "continuar de onde parou" (ou a próxima aula sugerida). */
export function ContinueLink({
  lesson,
  eyebrow,
}: {
  lesson: { title: string; href: string; course?: string; module?: string };
  eyebrow: string;
}) {
  return (
    <Link
      href={lesson.href}
      className="group rounded-btn border-accent/40 bg-accent/5 hover:border-accent flex items-center gap-4 border p-4 transition-colors"
    >
      <PlayCircle className="text-accent size-10 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="text-muted block text-xs">{eyebrow}</span>
        <span className="block truncate font-semibold">{lesson.title}</span>
        {lesson.course ? (
          <span className="text-muted block truncate text-sm">
            {lesson.course}
            {lesson.module ? ` · ${lesson.module}` : ""}
          </span>
        ) : null}
      </span>
      <ArrowRight
        className="text-accent size-5 shrink-0 transition-transform group-hover:translate-x-1"
        aria-hidden
      />
    </Link>
  );
}

/** Lista "assistidas por último". */
export function RecentLessons({ lessons }: { lessons: DashboardLesson[] }) {
  if (!lessons.length) return null;
  return (
    <div>
      <h3 className="text-muted mb-2 text-sm font-medium">Assistidas por último</h3>
      <ul className="divide-border flex flex-col divide-y">
        {lessons.map((l) => (
          <li key={l.id}>
            <Link
              href={l.href}
              className="hover:text-accent flex items-center gap-3 py-2.5 text-sm transition-colors"
            >
              {l.completed ? (
                <CheckCircle2 className="text-success size-4 shrink-0" aria-label="Concluída" />
              ) : (
                <PlayCircle className="text-muted size-4 shrink-0" aria-label="Em andamento" />
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
  );
}

/** Lista de atividades enviadas, com a nota. */
export function RecentAttempts({ dashboard }: { dashboard: StudentDashboard }) {
  return (
    <>
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
    </>
  );
}

/** Aviso no topo do painel. */
export function Notice({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "warning";
  children: ReactNode;
}) {
  return (
    <p
      role="status"
      className={`rounded-card mb-6 flex items-start gap-3 border p-4 text-sm ${
        tone === "warning" ? "border-warning/50 bg-warning/10" : "border-border bg-surface-2"
      }`}
    >
      <AlertTriangle
        className={`mt-0.5 size-5 shrink-0 ${tone === "warning" ? "text-warning" : "text-muted"}`}
        aria-hidden
      />
      <span>{children}</span>
    </p>
  );
}

/** Conta do aluno: nome, e-mail, formas de entrar, aparelhos e sair. */
export function AccountCard({ viewer, area }: { viewer: Viewer; area: StudentArea }) {
  const methods = [
    area.signInMethods.google ? "Google" : null,
    area.signInMethods.password ? "e-mail e senha" : null,
  ].filter(Boolean);
  return (
    <section aria-labelledby="conta" className={`${card} lg:col-span-2`}>
      <CardTitle id="conta">Minha conta</CardTitle>
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
            {area.openSessions} de {MAX_SESSIONS} (ao entrar num 3º, o mais antigo sai)
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-wrap gap-3">
        <SignOutButton />
        {!area.signInMethods.password ? (
          <ButtonLink href="/esqueci-a-senha" variant="ghost">
            Criar senha
          </ButtonLink>
        ) : null}
      </div>
    </section>
  );
}

/** Cabeçalho do painel: "Olá, Nome!" com o selo do plano. */
export function DashboardHeader({
  name,
  badge,
  subtitle,
}: {
  name: string;
  badge: ReactNode;
  subtitle: string;
}) {
  return (
    <header className="mb-8 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Olá, <span className="text-accent">{name.trim().split(/\s+/)[0] || "aluno"}</span>!
        </h1>
        {badge}
      </div>
      <p className="text-muted">{subtitle}</p>
    </header>
  );
}
