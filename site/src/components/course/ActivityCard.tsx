import Link from "next/link";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import type { Access } from "@/lib/access";
import { plural } from "@/lib/format";
import { DIFFICULTIES, DIFFICULTY_TONES } from "@/lib/labels";

type ActivityCardProps = {
  activity: {
    id: number;
    title: string;
    difficulty: keyof typeof DIFFICULTIES;
    questions: number;
    access: Access;
  };
  moduleTitle: string;
};

/** Cartão de atividade (inspiração 09): título, selo de dificuldade e nº de questões. */
export function ActivityCard({ activity, moduleTitle }: ActivityCardProps) {
  const locked = activity.access === "locked";
  return (
    <article className="rounded-card border-border bg-surface flex h-full flex-col gap-3 border p-5">
      <p className="text-muted text-xs">{moduleTitle}</p>
      <h3 className="font-semibold">{activity.title}</h3>
      <div className="text-muted flex flex-wrap items-center gap-2 text-sm">
        <Badge tone={DIFFICULTY_TONES[activity.difficulty]}>
          {DIFFICULTIES[activity.difficulty]}
        </Badge>
        {plural(activity.questions, "questão", "questões")}
        {activity.access === "free" ? <Badge tone="success">Grátis</Badge> : null}
      </div>
      <div className="mt-auto pt-3">
        {locked ? (
          <p className="rounded-btn border-border text-muted flex h-11 items-center justify-center gap-2 border text-sm">
            <Lock className="size-4" aria-hidden /> Para assinantes
          </p>
        ) : (
          <Link
            href={`/atividades/${activity.id}`}
            className={`${buttonClasses("primary")} w-full`}
          >
            Iniciar
          </Link>
        )}
      </div>
    </article>
  );
}
