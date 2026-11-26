import { Pin } from "lucide-react";
import { Markdown } from "@portfolio/ui/Markdown";
import { formatDateTime } from "@/lib/format";

type AnnouncementCardProps = {
  announcement: {
    title: string;
    isPinned: boolean;
    author: string;
    body: string;
    createdAt: Date;
    reactions: { like: number; love: number; celebrate: number };
  };
};

const REACTIONS = [
  { key: "like", emoji: "👍", label: "Curtir" },
  { key: "love", emoji: "❤️", label: "Amei" },
  { key: "celebrate", emoji: "🎉", label: "Comemorar" },
] as const;

/** Aviso do professor (inspiração 05): autor, data, texto e reações (só leitura). */
export function AnnouncementCard({ announcement: a }: AnnouncementCardProps) {
  return (
    <article
      className={`rounded-card bg-surface border p-5 ${a.isPinned ? "border-accent/50" : "border-border"}`}
    >
      <header className="flex items-center gap-3">
        <span
          aria-hidden
          className="bg-accent/15 text-accent flex size-10 items-center justify-center rounded-full font-semibold"
        >
          {a.author.trim()[0]?.toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{a.author}</p>
          <p className="text-muted text-xs">{formatDateTime(a.createdAt)}</p>
        </div>
        {a.isPinned ? (
          <span className="text-accent inline-flex items-center gap-1 text-xs">
            <Pin className="size-3.5" aria-hidden /> Fixado
          </span>
        ) : null}
      </header>
      <h3 className="mt-4 font-semibold">{a.title}</h3>
      <Markdown source={a.body} className="text-muted text-sm" />
      <ul
        className="border-border text-muted mt-3 flex gap-4 border-t pt-3 text-sm"
        aria-label="Reações"
      >
        {REACTIONS.map((r) => (
          <li key={r.key} title={r.label}>
            <span aria-hidden>{r.emoji}</span> <span className="sr-only">{r.label}:</span>{" "}
            {a.reactions[r.key]}
          </li>
        ))}
      </ul>
    </article>
  );
}
