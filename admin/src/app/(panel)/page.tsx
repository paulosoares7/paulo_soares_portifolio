import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CreditCard, Mail, MessagesSquare, Users, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { prisma } from "@portfolio/database";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoney, startOfMonthInManaus } from "@/lib/format";

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

/** Resumo inicial: assinantes, receita do mês, fila do fórum (RF32). */
export default async function SummaryPage() {
  const now = new Date();
  const monthStart = startOfMonthInManaus(now);

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
    </>
  );
}
