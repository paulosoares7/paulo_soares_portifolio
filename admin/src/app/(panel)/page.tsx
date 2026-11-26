import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CreditCard, Mail, MessagesSquare, Users, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prisma } from "@portfolio/database";
import { BarList } from "@/components/charts/BarList";
import { PeriodFilter } from "@/components/charts/PeriodFilter";
import { ShareBar } from "@/components/charts/ShareBar";
import { TimeChart } from "@/components/charts/TimeChart";
import { Card, CardTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney, startOfMonthInManaus } from "@/lib/format";
import {
  getAccesses,
  getAudienceMix,
  getCancellations,
  getGrowth,
  getRevenueByMonth,
  getTopActivities,
  getTopCourses,
  getTopLessons,
} from "@/lib/metrics";
import { parsePeriod } from "@/lib/period";

export const metadata: Metadata = { title: "Resumo" };

type StatProps = {
  label: string;
  value: string;
  hint?: string;
  href: string;
  icon: LucideIcon;
  highlight?: boolean;
};

function Stat({ label, value, hint, href, icon: Icon, highlight }: StatProps) {
  return (
    <Link
      href={href}
      className={`rounded-card bg-surface hover:border-accent flex flex-col gap-2 border p-5 transition-colors ${highlight ? "border-warning/60" : "border-border"}`}
    >
      <span className="text-muted flex items-center gap-2 text-sm">
        <Icon className="size-4" aria-hidden />
        {label}
      </span>
      <span className="text-text text-3xl font-semibold">{value}</span>
      {hint ? <span className="text-muted text-xs">{hint}</span> : null}
    </Link>
  );
}

/**
 * Resumo inicial: assinantes, receita do mês, fila do fórum (RF32) e os
 * gráficos do período escolhido (?periodo=7d|30d|12m|custom&de=&ate=).
 */
export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; de?: string; ate?: string }>;
}) {
  const now = new Date();
  const monthStart = startOfMonthInManaus(now);
  const params = await searchParams;
  const period = parsePeriod(params, now);
  const [mix, growth, cancellations, revenueByMonth, topCourses, topLessons, activities, accesses] =
    await Promise.all([
      getAudienceMix(now),
      getGrowth(period),
      getCancellations(period),
      getRevenueByMonth(period),
      getTopCourses(now),
      getTopLessons(period),
      getTopActivities(period),
      getAccesses(period),
    ]);
  const sum = (points: { values: number[] }[], index: number) =>
    points.reduce((total, p) => total + (p.values[index] ?? 0), 0);

  const [
    activeSubs,
    courtesySubs,
    revenue,
    pendingPosts,
    unreadMessages,
    publishedCourses,
    lessonsWithoutVideo,
  ] = await Promise.all([
    prisma.subscription.count({
      where: { status: "active", gateway: "asaas", currentPeriodEnd: { gt: now } },
    }),
    prisma.subscription.count({
      where: { status: "active", gateway: "manual", currentPeriodEnd: { gt: now } },
    }),
    // Receita = cobranças pagas no mês corrente (fuso de Manaus).
    prisma.payment.aggregate({
      _sum: { amountCents: true, netAmountCents: true },
      where: { status: { in: ["confirmed", "received"] }, paidAt: { gte: monthStart } },
    }),
    prisma.forumPost.count({ where: { status: "pending" } }),
    prisma.contactMessage.count({ where: { readAt: null } }),
    prisma.course.count({ where: { status: "published" } }),
    prisma.lesson.count({ where: { videoId: null, status: "published" } }),
  ]);

  const gross = revenue._sum.amountCents ?? 0;
  const net = revenue._sum.netAmountCents;
  const monthName = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "America/Manaus",
  }).format(now);

  return (
    <>
      <PageHeader title="Resumo" description="Visão geral da plataforma." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Assinantes ativos"
          value={String(activeSubs)}
          hint={`+ ${courtesySubs} cortesia(s)`}
          href="/assinaturas"
          icon={Users}
        />
        <Stat
          label={`Receita de ${monthName}`}
          value={formatMoney(gross)}
          hint={
            net != null ? `Líquido após tarifas: ${formatMoney(net)}` : "Cobranças pagas no mês"
          }
          href="/assinaturas"
          icon={CreditCard}
        />
        <Stat
          label="Posts aguardando aprovação"
          value={String(pendingPosts)}
          hint="Fila do fórum"
          href="/forum"
          icon={MessagesSquare}
          highlight={pendingPosts > 0}
        />
        <Stat
          label="Mensagens não lidas"
          value={String(unreadMessages)}
          href="/mensagens"
          icon={Mail}
          highlight={unreadMessages > 0}
        />
        <Stat
          label="Disciplinas publicadas"
          value={String(publishedCourses)}
          href="/disciplinas"
          icon={BookOpen}
        />
        <Stat
          label="Aulas sem vídeo"
          value={String(lessonsWithoutVideo)}
          hint='Aparecem como "vídeo em breve"'
          href="/videos"
          icon={Video}
        />
      </div>

      <div className="mt-10 mb-4 flex flex-col gap-3">
        <h2 className="text-text text-lg font-semibold">Gráficos</h2>
        <PeriodFilter period={period} basePath="/" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardTitle>Público agora</CardTitle>
          <ShareBar
            parts={[
              { label: "Assinantes ativos", value: mix.paid },
              { label: "Cortesias", value: mix.courtesy },
              { label: "Não assinantes", value: mix.none },
            ]}
          />
        </Card>
        <Card>
          <CardTitle>Novos cadastros e assinaturas</CardTitle>
          <p className="text-muted -mt-2 mb-3 text-xs">
            {sum(growth, 0)} cadastro(s), {sum(growth, 1)} assinatura(s) paga(s) e {sum(growth, 2)}{" "}
            cortesia(s) no período
          </p>
          <TimeChart
            label="Novos cadastros e assinaturas no período"
            kind="lines"
            points={growth}
            series={["Cadastros", "Assinaturas pagas", "Cortesias"]}
          />
        </Card>
        <Card>
          <CardTitle>Cancelamentos</CardTitle>
          <p className="text-muted -mt-2 mb-3 text-xs">
            {sum(cancellations, 0)} assinatura(s) paga(s) e {sum(cancellations, 1)} cortesia(s)
            encerradas
          </p>
          <TimeChart
            label="Cancelamentos no período"
            kind="lines"
            points={cancellations}
            series={["Assinaturas pagas", "Cortesias"]}
          />
        </Card>
        <Card>
          <CardTitle>Receita por mês</CardTitle>
          <p className="text-muted -mt-2 mb-3 text-xs">
            {formatMoney(sum(revenueByMonth, 0))} em cobranças pagas no período
          </p>
          <TimeChart
            label="Receita por mês"
            points={revenueByMonth}
            series={["Receita"]}
            format="money"
          />
        </Card>
        <Card>
          <CardTitle>Acessos {period.bucket === "day" ? "por dia" : "por mês"}</CardTitle>
          <p className="text-muted -mt-2 mb-3 text-xs">
            {sum(accesses.points, 0)} entrada(s) de {accesses.students} aluno(s) diferente(s)
          </p>
          <TimeChart label="Acessos à plataforma" points={accesses.points} series={["Acessos"]} />
        </Card>
        <Card>
          <CardTitle>Disciplinas mais escolhidas</CardTitle>
          <p className="text-muted -mt-2 mb-3 text-xs">Nas vagas das assinaturas vigentes</p>
          <BarList items={topCourses} unit="aluno(s)" empty="Nenhuma disciplina escolhida ainda." />
        </Card>
        <Card>
          <CardTitle>Aulas mais assistidas</CardTitle>
          <p className="text-muted -mt-2 mb-3 text-xs">
            Vezes que o vídeo foi aberto no período e taxa de conclusão
          </p>
          <BarList items={topLessons} unit="vez(es)" empty="Nenhuma aula assistida no período." />
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>Atividades mais feitas</CardTitle>
          <p className="text-muted -mt-2 mb-3 text-xs">
            Tentativas enviadas no período ·{" "}
            {activities.average === null
              ? "sem notas"
              : `média geral ${Math.round(activities.average)}% da nota máxima`}
          </p>
          <BarList
            items={activities.items}
            unit="tentativa(s)"
            empty="Nenhuma atividade enviada no período."
          />
        </Card>
      </div>
    </>
  );
}
