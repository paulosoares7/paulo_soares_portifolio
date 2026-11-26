import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, MessagesSquare } from "lucide-react";
import { LessonRow } from "@/components/course/LessonRow";
import { MaterialList } from "@/components/course/MaterialList";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { Badge } from "@portfolio/ui/Badge";
import { Container } from "@portfolio/ui/Container";
import { Markdown } from "@portfolio/ui/Markdown";
import { getLessonPage } from "@/lib/lesson";

type Props = { params: Promise<{ courseSlug: string; moduleSlug: string; lessonSlug: string }> };

/** Título e resumo da aula para buscadores. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug, moduleSlug, lessonSlug } = await params;
  const data = await getLessonPage(courseSlug, moduleSlug, lessonSlug);
  if (!data) return {};
  return {
    title: `${data.lesson.title} · ${data.course.title}`,
    description: data.lesson.summary ?? `${data.module.title} — ${data.course.title}`,
  };
}

/**
 * Página da aula (RF07): player grande, aulas do módulo ao lado, resumo,
 * texto de apoio, materiais e comentários. Só aula grátis (ou de assinante)
 * recebe o vídeo; as demais mostram o cadeado (RF08).
 */
export default async function LessonPage({ params }: Props) {
  const { courseSlug, moduleSlug, lessonSlug } = await params;
  const data = await getLessonPage(courseSlug, moduleSlug, lessonSlug);
  if (!data) notFound();
  const {
    lesson,
    module,
    course,
    access,
    player,
    sidebar,
    previous,
    next,
    materials,
    discussions,
  } = data;
  const lessonHref = (slug: string) => `/disciplina/${course.slug}/${module.slug}/${slug}`;

  return (
    <Container className="pt-6">
      <nav aria-label="Caminho" className="text-muted flex flex-wrap items-center gap-1 text-sm">
        <Link href="/aulas" className="hover:text-accent">
          Aulas
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <Link href={`/disciplina/${course.slug}`} className="hover:text-accent">
          {course.title}
        </Link>
        <ChevronRight className="size-4" aria-hidden />
        <span>{module.title}</span>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <VideoPlayer title={lesson.title} player={player} />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {access === "free" ? <Badge tone="success">Aula grátis</Badge> : null}
            {access === "locked" ? <Badge>Assinantes</Badge> : null}
            {player === "coming-soon" ? <Badge tone="warning">vídeo em breve</Badge> : null}
            <span className="text-muted text-sm">{lesson.topic}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
          {lesson.summary ? <p className="text-muted mt-2">{lesson.summary}</p> : null}

          {lesson.content ? (
            <section
              aria-label="Texto de apoio"
              className="rounded-card border-border bg-surface mt-6 border p-5 sm:p-6"
            >
              <Markdown source={lesson.content} />
            </section>
          ) : null}

          <nav aria-label="Aulas vizinhas" className="mt-6 grid gap-3 sm:grid-cols-2">
            {previous ? (
              <Link
                href={lessonHref(previous.slug)}
                className="rounded-btn border-border hover:border-accent flex items-center gap-2 border p-3 text-sm"
              >
                <ChevronLeft className="text-accent size-4 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <span className="text-muted block text-xs">Anterior</span>
                  <span className="block truncate">{previous.title}</span>
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={lessonHref(next.slug)}
                className="rounded-btn border-border hover:border-accent flex items-center justify-end gap-2 border p-3 text-right text-sm"
              >
                <span className="min-w-0">
                  <span className="text-muted block text-xs">Próxima</span>
                  <span className="block truncate">{next.title}</span>
                </span>
                <ChevronRight className="text-accent size-4 shrink-0" aria-hidden />
              </Link>
            ) : null}
          </nav>

          <section aria-labelledby="materiais-aula" className="mt-10">
            <h2 id="materiais-aula" className="mb-4 text-xl font-semibold">
              Materiais da aula
            </h2>
            <MaterialList items={materials} />
          </section>

          <section aria-labelledby="comentarios" className="mt-10">
            <h2 id="comentarios" className="mb-4 text-xl font-semibold">
              Comentários
            </h2>
            <p className="rounded-card border-border bg-surface-2 text-muted flex items-start gap-3 border p-4 text-sm">
              <MessagesSquare className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
              {discussions > 0
                ? `${discussions} conversa(s) sobre esta aula. Dúvidas e comentários são para assinantes da disciplina.`
                : "Dúvidas e comentários sobre esta aula são para assinantes da disciplina."}
            </p>
          </section>
        </div>

        <aside
          aria-label={`Aulas do módulo ${module.title}`}
          className="lg:sticky lg:top-20 lg:self-start"
        >
          <div className="rounded-card border-border bg-surface border p-4">
            <p className="text-accent text-xs font-semibold tracking-wide uppercase">Módulo</p>
            <p className="mb-4 font-semibold">{module.title}</p>
            <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto pr-1">
              {sidebar.map((item) => (
                <LessonRow
                  key={item.id}
                  lesson={item}
                  href={lessonHref(item.slug)}
                  current={item.id === lesson.id}
                />
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </Container>
  );
}
