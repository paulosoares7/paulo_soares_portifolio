import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
import { ActivityRunner } from "@/components/activities/ActivityRunner";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Markdown } from "@/components/ui/Markdown";
import { getActivityPage } from "@/lib/activity";
import { plural } from "@/lib/format";
import { DIFFICULTIES, DIFFICULTY_TONES } from "@/lib/labels";

type Props = { params: Promise<{ activityId: string }> };

/** Título da atividade para buscadores. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = Number((await params).activityId);
  const activity = Number.isInteger(id) && id > 0 ? await getActivityPage(id) : null;
  return activity ? { title: `${activity.title} · ${activity.module.course.title}` } : {};
}

/**
 * Atividade (RF08): a grátis abre sem código e é corrigida no servidor; a
 * paga mostra só o cadeado (os enunciados nem são enviados).
 */
export default async function ActivityPage({ params }: Props) {
  const id = Number((await params).activityId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const activity = await getActivityPage(id);
  if (!activity) notFound();
  const { course } = activity.module;
  const locked = activity.access === "locked";

  return (
    <Container className="max-w-3xl">
      <nav
        aria-label="Caminho"
        className="text-muted flex flex-wrap items-center gap-1 pt-8 text-sm"
      >
        <Link href={`/disciplina/${course.slug}?aba=atividades`} className="hover:text-accent">
          {course.title}
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span>{activity.module.title}</span>
      </nav>
      <header className="mt-4 mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={DIFFICULTY_TONES[activity.difficulty]}>
            {DIFFICULTIES[activity.difficulty]}
          </Badge>
          {activity.access === "free" ? <Badge tone="success">Grátis</Badge> : null}
          <span className="text-muted text-sm">
            {plural(activity.questions.length, "questão", "questões")}
          </span>
        </div>
        <h1 className="mt-3 text-3xl font-bold">{activity.title}</h1>
        {activity.instructions && !locked ? (
          <Markdown source={activity.instructions} className="text-muted" />
        ) : null}
      </header>

      {locked ? (
        <section className="rounded-card border-border bg-surface flex flex-col items-center gap-4 border p-10 text-center">
          <Lock className="text-accent size-10" aria-hidden />
          <p className="text-lg font-semibold">Atividade para assinantes</p>
          <p className="text-muted max-w-md text-sm">
            Assine para fazer esta atividade, ver a correção e acompanhar suas tentativas.
          </p>
          <ButtonLink href="/assinar">Quero assinar</ButtonLink>
        </section>
      ) : (
        <ActivityRunner
          activityId={activity.id}
          questions={activity.questions.map((q) => ({
            id: q.id,
            type: q.type,
            points: Number(q.points),
            unit: q.unit,
            // Enunciado renderizado no servidor (Markdown + LaTeX) e passado pronto.
            statement: <Markdown source={q.statement} />,
            imageUrl: q.imageFile?.publicUrl ?? null,
            options: q.options,
          }))}
        />
      )}
    </Container>
  );
}
