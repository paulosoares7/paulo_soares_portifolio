import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { ActivityCard } from "@/components/course/ActivityCard";
import { LessonRow } from "@/components/course/LessonRow";
import { MaterialList } from "@/components/course/MaterialList";
import { AnnouncementCard } from "@/components/forum/AnnouncementCard";
import { SubscribeCta } from "@/components/subscription/SubscribeCta";
import { Badge } from "@portfolio/ui/Badge";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { Container } from "@portfolio/ui/Container";
import { Markdown } from "@portfolio/ui/Markdown";
import { canUseForum } from "@/lib/access";
import { getActivePlan, getCoursePage } from "@/lib/catalog";
import { CourseIcon } from "@/lib/course-icons";
import { plural } from "@/lib/format";

const TABS = [
  { key: "aulas", label: "Aulas" },
  { key: "atividades", label: "Atividades" },
  { key: "materiais", label: "Materiais" },
  { key: "forum", label: "Fórum" },
] as const;
type Tab = (typeof TABS)[number]["key"];

type Props = { params: Promise<{ courseSlug: string }>; searchParams: Promise<{ aba?: string }> };

/** Título e descrição da disciplina para buscadores. */
export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const data = await getCoursePage((await params).courseSlug);
  if (!data) return {};
  return { title: data.course.title, description: data.course.shortDescription };
}

/**
 * Página da disciplina (RF06): abas Aulas, Atividades, Materiais e Fórum.
 * As abas são links (?aba=...) renderizados no servidor, bons para SEO.
 */
export default async function CoursePage({ params, searchParams }: Props) {
  const [{ courseSlug }, { aba }] = await Promise.all([params, searchParams]);
  const data = await getCoursePage(courseSlug);
  if (!data) notFound();
  const tab: Tab = TABS.some((t) => t.key === aba) ? (aba as Tab) : "aulas";
  const { course, modules, materials, announcements, stats } = data;
  const plan = stats.locked ? await getActivePlan() : null;
  const forumOpen = await canUseForum(course.id);

  return (
    <Container>
      <Breadcrumb
        className="pt-8"
        items={[
          { label: "Aulas", href: "/aulas" },
          { label: course.category.name, href: `/aulas/${course.category.slug}` },
          {
            label: course.group.name,
            href: `/aulas/${course.category.slug}/${course.group.slug}`,
          },
          { label: course.title },
        ]}
      />

      <header className="mt-4 mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
        <CourseIcon name={course.icon} color={course.color} size="lg" />
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{course.title}</h1>
          <p className="text-muted mt-2 max-w-2xl">{course.shortDescription}</p>
          <p className="text-muted mt-3 flex flex-wrap gap-2 text-sm">
            <Badge>{plural(stats.modules, "módulo", "módulos")}</Badge>
            <Badge>{plural(stats.lessons, "aula", "aulas")}</Badge>
            <Badge>{plural(stats.activities, "atividade", "atividades")}</Badge>
            {stats.free ? (
              <Badge tone="success">{plural(stats.free, "item grátis", "itens grátis")}</Badge>
            ) : null}
          </p>
        </div>
      </header>

      {/* Abas no estilo pílula (inspirações 08 e 09). */}
      <nav aria-label="Seções da disciplina" className="-mx-4 mb-8 overflow-x-auto px-4">
        <ul className="rounded-card border-border bg-surface-2 flex min-w-max gap-1 border p-1">
          {TABS.map((t) => (
            <li key={t.key} className="flex-1">
              <Link
                href={
                  t.key === "aulas"
                    ? `/disciplina/${course.slug}`
                    : `/disciplina/${course.slug}?aba=${t.key}`
                }
                aria-current={tab === t.key ? "page" : undefined}
                scroll={false}
                className={`rounded-btn block px-5 py-2 text-center text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-accent text-bg" : "text-muted hover:text-text"
                }`}
              >
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {tab === "aulas" ? (
        <div className="flex flex-col gap-6">
          {stats.locked ? <SubscribeCta plan={plan} compact /> : null}
          {modules.length === 0 ? (
            <p className="text-muted">Os módulos desta disciplina ainda estão sendo preparados.</p>
          ) : null}
          {modules.map((mod, index) => (
            <section
              key={mod.id}
              aria-labelledby={`modulo-${mod.id}`}
              className="rounded-card border-border bg-surface border p-5 sm:p-6"
            >
              <p className="text-accent text-xs font-semibold tracking-wide uppercase">
                Módulo {index + 1}
              </p>
              <h2 id={`modulo-${mod.id}`} className="mt-1 text-xl font-semibold">
                {mod.title}
              </h2>
              {mod.description ? (
                <p className="text-muted mt-1 text-sm">{mod.description}</p>
              ) : null}
              <div className="mt-5 flex flex-col gap-6">
                {mod.topics.map((topic) => (
                  <div key={topic.id}>
                    <h3 className="text-muted mb-3 text-sm font-semibold">{topic.title}</h3>
                    <ul className="flex flex-col gap-2">
                      {topic.lessons.map((lesson) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          href={`/disciplina/${course.slug}/${mod.slug}/${lesson.slug}`}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {course.description ? (
            <section className="rounded-card border-border bg-surface-2 border p-6">
              <h2 className="text-lg font-semibold">Sobre a disciplina</h2>
              <Markdown source={course.description} className="text-muted" />
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "atividades" ? (
        modules.some((m) => m.activities.length) ? (
          <ul className="grid gap-5 sm:grid-cols-2">
            {modules.flatMap((mod) =>
              mod.activities.map((activity) => (
                <li key={activity.id}>
                  <ActivityCard activity={activity} moduleTitle={mod.title} />
                </li>
              )),
            )}
          </ul>
        ) : (
          <p className="rounded-card border-border text-muted border border-dashed px-4 py-10 text-center">
            Nenhuma atividade publicada ainda.
          </p>
        )
      ) : null}

      {tab === "materiais" ? <MaterialList items={materials} /> : null}

      {tab === "forum" ? (
        <div className="flex flex-col gap-5">
          {forumOpen ? null : (
            <p className="rounded-card border-border bg-surface-2 text-muted flex items-start gap-3 border p-4 text-sm">
              <MessagesSquare className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
              Aqui ficam os avisos do professor. Dúvidas e discussões com a turma são para
              assinantes da disciplina.
            </p>
          )}
          {announcements.length === 0 ? (
            <p className="rounded-card border-border text-muted border border-dashed px-4 py-10 text-center">
              Nenhum aviso publicado.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {announcements.map((a) => (
                <li key={a.id}>
                  <AnnouncementCard announcement={a} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </Container>
  );
}
