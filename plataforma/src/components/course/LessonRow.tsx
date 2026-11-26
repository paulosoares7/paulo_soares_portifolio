import Link from "next/link";
import { Clock, Lock, Play, Video, VideoOff } from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import type { LessonListItem } from "@/lib/catalog";
import { formatMinutes } from "@/lib/format";

/**
 * Linha de aula (inspiração 08): ícone, título, duração e a ação à direita.
 * Grátis → "Assistir"; paga → cadeado; sem vídeo → selo "vídeo em breve".
 */
export function LessonRow({
  lesson,
  href,
  current = false,
}: {
  lesson: LessonListItem;
  href: string;
  current?: boolean;
}) {
  const locked = lesson.access === "locked";
  const duration = formatMinutes(lesson.durationSeconds);
  return (
    <li>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={`group rounded-btn bg-surface-2 hover:border-accent/50 flex items-center gap-4 border p-3 transition-colors sm:p-4 ${
          current ? "border-accent" : "border-transparent"
        } ${locked ? "opacity-80" : ""}`}
      >
        <span
          aria-hidden
          className={`rounded-btn flex size-10 shrink-0 items-center justify-center ${
            locked
              ? "bg-border/40 text-muted"
              : lesson.hasVideo
                ? "bg-accent/15 text-accent"
                : "bg-warning/10 text-warning"
          }`}
        >
          {locked ? (
            <Lock className="size-5" />
          ) : lesson.hasVideo ? (
            <Video className="size-5" />
          ) : (
            <VideoOff className="size-5" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="group-hover:text-accent block font-medium">{lesson.title}</span>
          <span className="text-muted mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {duration ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden /> {duration}
              </span>
            ) : null}
            {lesson.hasVideo ? null : <Badge tone="warning">vídeo em breve</Badge>}
          </span>
        </span>
        {lesson.access === "free" ? (
          <span className="flex shrink-0 items-center gap-2">
            <Badge tone="success">Grátis</Badge>
            <span className="rounded-btn bg-accent text-bg hidden items-center gap-1 px-3 py-1.5 text-xs font-semibold sm:inline-flex">
              <Play className="size-3.5" aria-hidden /> Assistir
            </span>
          </span>
        ) : lesson.access === "subscriber" ? (
          <span className="rounded-btn bg-accent text-bg inline-flex shrink-0 items-center gap-1 px-3 py-1.5 text-xs font-semibold">
            <Play className="size-3.5" aria-hidden /> Assistir
          </span>
        ) : (
          <span className="text-muted inline-flex shrink-0 items-center gap-1 text-xs">
            <Lock className="size-3.5" aria-hidden /> Assinantes
          </span>
        )}
      </Link>
    </li>
  );
}
