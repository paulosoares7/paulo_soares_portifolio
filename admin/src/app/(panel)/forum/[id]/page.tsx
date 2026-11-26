import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Award, Check, Eye, EyeOff, Pin, PinOff, Trash2, X } from "lucide-react";
import { prisma } from "@portfolio/database";
import {
  deleteThread,
  moderatePost,
  setOfficialAnswer,
  setThreadPinned,
  setThreadStatus,
} from "@/actions/forum";
import { ReplyForm } from "@/components/forms/ReplyForm";
import { ActionButton } from "@/components/ui/ActionButton";
import { Badge } from "@/components/ui/Badge";
import { Card, CardTitle } from "@/components/ui/Card";
import { MarkdownPreview } from "@/components/ui/MarkdownEditor";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime } from "@/lib/format";
import { MODERATION_STATUSES, THREAD_TYPES } from "@/lib/labels";

export const metadata: Metadata = { title: "Tópico" };

const STATUS_TONE = { visible: "success", pending: "warning", hidden: "neutral" } as const;
const REACTION_ICON = { like: "👍", love: "❤️", celebrate: "🎉" } as const;

/** Tópico: posts com aprovação, resposta oficial, fixar, ocultar e responder (RF30). */
export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: {
      course: { select: { title: true } },
      lesson: { select: { title: true } },
      posts: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          student: { select: { displayName: true, name: true } },
          adminUser: { select: { name: true } },
          reactions: { select: { type: true } },
        },
      },
    },
  });
  if (!thread) notFound();
  const isQuestion = thread.type === "question";

  return (
    <>
      <PageHeader
        title={thread.title}
        back={{ href: "/forum", label: "Fórum" }}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {thread.course.title}
            {thread.lesson ? ` › ${thread.lesson.title}` : " · discussão geral"}
            <Badge tone={thread.type === "announcement" ? "accent" : "neutral"}>
              {THREAD_TYPES[thread.type]}
            </Badge>
            <Badge tone={STATUS_TONE[thread.status]}>{MODERATION_STATUSES[thread.status]}</Badge>
            {thread.isPinned ? <Badge tone="warning">fixado</Badge> : null}
            {thread.isResolved ? <Badge tone="success">resolvida</Badge> : null}
          </span>
        }
        actions={
          <>
            <ActionButton
              action={setThreadPinned.bind(null, thread.id, !thread.isPinned)}
              variant="secondary"
              size="md"
            >
              {thread.isPinned ? (
                <PinOff className="size-4" aria-hidden />
              ) : (
                <Pin className="size-4" aria-hidden />
              )}
              {thread.isPinned ? "Desafixar" : "Fixar"}
            </ActionButton>
            {thread.status !== "pending" ? (
              <ActionButton
                action={setThreadStatus.bind(
                  null,
                  thread.id,
                  thread.status === "visible" ? "hidden" : "visible",
                )}
                variant="secondary"
                size="md"
              >
                {thread.status === "visible" ? (
                  <EyeOff className="size-4" aria-hidden />
                ) : (
                  <Eye className="size-4" aria-hidden />
                )}
                {thread.status === "visible" ? "Ocultar" : "Mostrar"}
              </ActionButton>
            ) : null}
            <ActionButton
              action={deleteThread.bind(null, thread.id)}
              confirm="Apagar o tópico com todos os posts?"
              variant="danger"
              size="md"
            >
              <Trash2 className="size-4" aria-hidden /> Apagar
            </ActionButton>
          </>
        }
      />
      <div className="flex flex-col gap-4">
        {thread.posts.map((post, index) => {
          const reactions = post.reactions.reduce<Record<string, number>>(
            (acc, r) => ({ ...acc, [r.type]: (acc[r.type] ?? 0) + 1 }),
            {},
          );
          return (
            <Card
              key={post.id}
              className={
                post.isAnswer
                  ? "border-success/60"
                  : post.status === "pending"
                    ? "border-warning/50"
                    : ""
              }
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">
                    {post.adminUser
                      ? `${post.adminUser.name} (professor)`
                      : post.student?.displayName}
                  </span>
                  <span className="text-muted text-xs">{formatDateTime(post.createdAt)}</span>
                  {index === 0 ? <Badge>início do tópico</Badge> : null}
                  <Badge tone={STATUS_TONE[post.status]}>{MODERATION_STATUSES[post.status]}</Badge>
                  {post.isAnswer ? <Badge tone="success">resposta oficial</Badge> : null}
                </p>
                <div className="flex gap-1">
                  {post.status !== "visible" ? (
                    <ActionButton
                      action={moderatePost.bind(null, post.id, "visible")}
                      variant="secondary"
                      title="Aprovar"
                    >
                      <Check className="size-4" aria-hidden /> Aprovar
                    </ActionButton>
                  ) : null}
                  {post.status !== "hidden" && post.studentId ? (
                    <ActionButton
                      action={moderatePost.bind(null, post.id, "hidden")}
                      confirm="Ocultar este post?"
                      title="Ocultar"
                    >
                      <X className="size-4" aria-hidden />{" "}
                      {post.status === "pending" ? "Recusar" : "Ocultar"}
                    </ActionButton>
                  ) : null}
                  {index > 0 && post.status === "visible" ? (
                    <ActionButton
                      action={setOfficialAnswer.bind(null, post.id, !post.isAnswer)}
                      title={
                        post.isAnswer
                          ? "Desmarcar resposta oficial"
                          : "Marcar como resposta oficial"
                      }
                    >
                      <Award
                        className={`size-4 ${post.isAnswer ? "text-success" : ""}`}
                        aria-hidden
                      />{" "}
                      {post.isAnswer ? "Desmarcar" : "Resposta oficial"}
                    </ActionButton>
                  ) : null}
                </div>
              </div>
              <MarkdownPreview source={post.body} />
              {post.reactions.length ? (
                <p className="text-muted mt-3 flex gap-3 text-sm">
                  {Object.entries(reactions).map(([type, count]) => (
                    <span key={type}>
                      {REACTION_ICON[type as keyof typeof REACTION_ICON]} {count}
                    </span>
                  ))}
                </p>
              ) : null}
            </Card>
          );
        })}
        <Card>
          <CardTitle>Responder como professor</CardTitle>
          <ReplyForm threadId={thread.id} isQuestion={isQuestion} />
        </Card>
      </div>
    </>
  );
}
