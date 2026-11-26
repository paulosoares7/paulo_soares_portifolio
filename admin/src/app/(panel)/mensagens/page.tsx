import type { Metadata } from "next";
import { Mail, MailOpen, Reply } from "lucide-react";
import { prisma } from "@portfolio/database";
import { setMessageRead } from "@/actions/messages";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Mensagens" };

/** Caixa de mensagens do formulário de contato (RF31). */
export default async function MessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: [{ readAt: { sort: "asc", nulls: "first" } }, { createdAt: "desc" }],
    take: 200,
  });
  const unread = messages.filter((m) => !m.readAt).length;

  return (
    <>
      <PageHeader
        title="Mensagens"
        description={
          unread
            ? `${unread} não lida(s). As mais recentes primeiro.`
            : "Mensagens enviadas pelo formulário de contato do site."
        }
      />
      {messages.length === 0 ? (
        <EmptyState>Nenhuma mensagem recebida ainda.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`rounded-card border p-4 ${m.readAt ? "border-border bg-surface/50" : "border-accent/50 bg-surface"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {m.subject ?? "(sem assunto)"}
                    {m.readAt ? null : <Badge tone="accent">nova</Badge>}
                  </p>
                  <p className="text-muted text-sm">
                    {m.name} · {m.email} · {formatDateTime(m.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject ?? "seu contato"}`)}`}
                    className={buttonClasses("ghost", "sm")}
                  >
                    <Reply className="size-4" aria-hidden /> Responder
                  </a>
                  <ActionButton
                    action={setMessageRead.bind(null, m.id, !m.readAt)}
                    title={m.readAt ? "Marcar como não lida" : "Marcar como lida"}
                  >
                    {m.readAt ? (
                      <Mail className="size-4" aria-hidden />
                    ) : (
                      <MailOpen className="size-4" aria-hidden />
                    )}
                    {m.readAt ? "Não lida" : "Lida"}
                  </ActionButton>
                </div>
              </div>
              <p className="text-text mt-3 text-sm whitespace-pre-wrap">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
