import type { Metadata } from "next";
import Link from "next/link";
import { Check, ChevronRight, Megaphone, Pin, X } from "lucide-react";
import { prisma } from "@portfolio/database";
import { moderatePost } from "@/actions/forum";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MarkdownPreview } from "@/components/ui/MarkdownEditor";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime } from "@/lib/format";
import { MODERATION_STATUSES, THREAD_TYPES } from "@/lib/labels";

export const metadata: Metadata = { title: "Fórum" };

const STATUS_TONE = { visible: "success", pending: "warning", hidden: "neutral" } as const;

/** Fila de aprovação, avisos e tópicos recentes (RF30). */
export default async function ForumPage() {
  const [pending, threads] = await Promise.all([
    prisma.forumPost.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        student: { select: { displayName: true, name: true } },
        thread: {
          select: {
            id: true,
            title: true,
            type: true,
            course: { select: { title: true } },
            lesson: { select: { title: true } },
            posts: {
              orderBy: [{ createdAt: "asc" }, { id: "asc" }],
              take: 1,
              select: { id: true },
            },
          },
        },
      },
    }),
    prisma.forumThread.findMany({
      orderBy: [{ isPinned: "desc" }, { lastPostAt: "desc" }],
      take: 50,
      include: {
        course: { select: { title: true } },
        lesson: { select: { title: true } },
        student: { select: { displayName: true } },
        adminUser: { select: { name: true } },
        _count: { select: { posts: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Fórum"
        description="Post de aluno só aparece no site depois de aprovado. Avisos e respostas do professor entram visíveis."
        actions={
          <ButtonLink href="/forum/aviso">
            <Megaphone className="size-4" aria-hidden /> Novo aviso
          </ButtonLink>
        }
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle>Fila de aprovação ({pending.length})</CardTitle>
          {pending.length === 0 ? (
            <EmptyState>Nada aguardando aprovação.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3">
              {pending.map((post) => {
                const isThreadStart = post.thread.posts[0]?.id === post.id;
                return (
                  <li
                    key={post.id}
                    className="rounded-btn border-warning/40 bg-surface-2 border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                          {isThreadStart ? "Novo tópico:" : "Resposta em:"}
                          <Link href={`/forum/${post.thread.id}`} className="hover:text-accent">
                            {post.thread.title}
                          </Link>
                          <Badge>{THREAD_TYPES[post.thread.type]}</Badge>
                        </p>
                        <p className="text-muted text-xs">
                          {post.student?.displayName ?? "Professor"} ({post.student?.name ?? ""}) ·{" "}
                          {post.thread.course.title}
                          {post.thread.lesson ? ` › ${post.thread.lesson.title}` : ""} ·{" "}
                          {formatDateTime(post.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <ActionButton
                          action={moderatePost.bind(null, post.id, "visible")}
                          variant="secondary"
                          title="Aprovar"
                        >
                          <Check className="size-4" aria-hidden /> Aprovar
                        </ActionButton>
                        <ActionButton
                          action={moderatePost.bind(null, post.id, "hidden")}
                          variant="danger"
                          confirm="Recusar este post? Ele fica oculto."
                          title="Recusar"
                        >
                          <X className="size-4" aria-hidden /> Recusar
                        </ActionButton>
                      </div>
                    </div>
                    <div className="border-border mt-3 border-t pt-3">
                      <MarkdownPreview source={post.body} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Tópicos e avisos</CardTitle>
          {threads.length === 0 ? (
            <EmptyState>Nenhum tópico.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <Link
                    href={`/forum/${thread.id}`}
                    className="group rounded-btn border-border bg-surface-2 hover:border-accent flex items-center gap-3 border p-3"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="group-hover:text-accent flex flex-wrap items-center gap-2 text-sm font-medium">
                        {thread.isPinned ? (
                          <Pin className="text-warning size-3.5" aria-label="Fixado" />
                        ) : null}
                        {thread.title}
                        <Badge tone={thread.type === "announcement" ? "accent" : "neutral"}>
                          {THREAD_TYPES[thread.type]}
                        </Badge>
                        <Badge tone={STATUS_TONE[thread.status]}>
                          {MODERATION_STATUSES[thread.status]}
                        </Badge>
                        {thread.isResolved ? <Badge tone="success">resolvida</Badge> : null}
                      </span>
                      <span className="text-muted block text-xs">
                        {thread.course.title}
                        {thread.lesson ? ` › ${thread.lesson.title}` : ""} ·{" "}
                        {thread.student?.displayName ?? thread.adminUser?.name} ·{" "}
                        {thread._count.posts} post(s) · {formatDateTime(thread.lastPostAt)}
                      </span>
                    </span>
                    <ChevronRight className="text-muted size-4" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
