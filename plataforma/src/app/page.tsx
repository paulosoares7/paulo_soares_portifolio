import Link from "next/link";
import {
  ArrowRight,
  Atom,
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Landmark,
  MessagesSquare,
  PlayCircle,
  School,
  Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@portfolio/ui/Badge";
import { ButtonLink } from "@portfolio/ui/Button";
import { Container, SectionTitle } from "@portfolio/ui/Container";
import { CourseCard } from "@/components/catalog/CourseCard";
import { FreeDashboard } from "@/components/dashboard/FreeDashboard";
import { SubscriberDashboard } from "@/components/dashboard/SubscriberDashboard";
import { FINAL_CTA, HERO, INCLUDED, STEPS } from "@/content/home";
import { getActivePlan, getCatalog } from "@/lib/catalog";
import { formatMoney, plural } from "@/lib/format";
import { getViewer, type Viewer } from "@/lib/access";
import { getFreeLessons, getProfessorSummary, profilePhotoUrl } from "@/lib/home";
import { getStudentArea, getStudentDashboard } from "@/lib/student-area";

// A página depende de quem está logado (painel do aluno ou apresentação),
// então é montada a cada visita.
export const dynamic = "force-dynamic";

// Ícone de cada grupo do catálogo (slug de categories); outro slug usa o livro.
const GROUP_ICONS: Record<string, LucideIcon> = {
  vestibulares: GraduationCap,
  "ensino-medio": School,
  "ensino-superior": Atom,
  concursos: Landmark,
};

const INCLUDED_ICONS: Record<(typeof INCLUDED)[number]["icon"], LucideIcon> = {
  video: Video,
  activity: ClipboardCheck,
  material: FileText,
  forum: MessagesSquare,
};

/**
 * Painel do aluno logado (a página inicial dele): o de quem assina (ou tem
 * cortesia) é completo; o de quem não assina é simples, com a chamada para
 * assinar.
 * @param viewer Aluno logado.
 */
async function StudentHome({ viewer }: { viewer: Viewer }) {
  const area = await getStudentArea(viewer.id);
  const subscribedIds = area.subscription?.courses.map((c) => c.course.id) ?? [];
  const dashboard = await getStudentDashboard(viewer.id, subscribedIds);
  if (area.subscription)
    return <SubscriberDashboard viewer={viewer} area={area} dashboard={dashboard} />;
  const [plan, freeLessons] = await Promise.all([getActivePlan(), getFreeLessons()]);
  return (
    <FreeDashboard
      viewer={viewer}
      area={area}
      dashboard={dashboard}
      plan={plan}
      freeLessons={freeLessons}
    />
  );
}

/**
 * Página inicial da plataforma. Aluno logado: o painel dele (StudentHome).
 * Visitante: apresentação (abertura, como funciona, grupos,
 * aulas grátis, o que está incluído, plano, resumo do professor e chamada
 * final) e, no fim, as disciplinas publicadas.
 */
export default async function HomePage() {
  const viewer = await getViewer();
  if (viewer) return <StudentHome viewer={viewer} />;
  const [categories, plan, freeLessons, { profile }] = await Promise.all([
    getCatalog(),
    getActivePlan(),
    getFreeLessons(),
    getProfessorSummary(),
  ]);
  const maxCourses = plan?.maxCourses ?? 3;
  const courses = categories.flatMap((c) => c.courses);

  return (
    <>
      {/* 1. Abertura */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="bg-accent/10 pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full blur-3xl"
        />
        <Container className="relative py-16 md:py-24">
          <p className="text-accent text-sm font-semibold tracking-wide uppercase">
            {HERO.eyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-tight font-bold sm:text-5xl">
            {HERO.title}
          </h1>
          <p className="text-muted mt-5 max-w-2xl text-lg leading-relaxed">{HERO.text}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href={freeLessons[0]?.href ?? "/aulas"}>
              <PlayCircle className="size-4" aria-hidden /> Ver aulas grátis
            </ButtonLink>
            <ButtonLink href="/assinar" variant="outline">
              Assinar {plan ? `por ${formatMoney(plan.priceCents)}/mês` : null}
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* 2. Como funciona */}
      <Container className="mt-4">
        <SectionTitle>
          Como <span className="text-accent">funciona</span>
        </SectionTitle>
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-card border-border bg-surface border p-6">
              <span className="bg-accent/15 text-accent flex size-9 items-center justify-center rounded-full text-sm font-bold">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">
                {step.title.replace("{max}", String(maxCourses))}
              </h3>
              <p className="text-muted mt-2 text-sm leading-relaxed">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>

      {/* 3. Os grupos do catálogo */}
      <Container className="mt-20">
        <SectionTitle>
          Para quem <span className="text-accent">estuda</span>
        </SectionTitle>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => {
            const Icon = GROUP_ICONS[category.slug] ?? BookOpen;
            return (
              <li key={category.id}>
                <Link
                  href={`/aulas/${category.slug}`}
                  className="rounded-card border-border bg-surface hover:border-accent/60 flex h-full flex-col gap-3 border p-5 transition-colors"
                >
                  <span className="bg-accent/10 text-accent flex size-11 items-center justify-center rounded-full">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-semibold">{category.name}</span>
                  <span className="text-muted text-sm">
                    {category.courses.length
                      ? plural(category.courses.length, "disciplina", "disciplinas")
                      : "em breve"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>

      {/* 4. Aulas grátis em destaque */}
      {freeLessons.length ? (
        <Container className="mt-20">
          <SectionTitle
            action={
              <Link
                href="/aulas"
                className="text-accent inline-flex items-center gap-1 text-sm hover:underline"
              >
                Todas as aulas <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          >
            Experimente <span className="text-accent">grátis</span>
          </SectionTitle>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {freeLessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={lesson.href}
                  className="rounded-card border-border bg-surface hover:border-accent/60 flex h-full flex-col gap-3 border p-5 transition-colors"
                >
                  <PlayCircle className="text-accent size-8" aria-hidden />
                  <span className="font-semibold">{lesson.title}</span>
                  <span className="text-muted mt-auto flex items-center gap-2 text-xs">
                    <Badge tone="success">Grátis</Badge> {lesson.courseTitle}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      ) : null}

      {/* 5. O que está incluído + 6. Plano */}
      <Container className="mt-20 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="incluido">
          <SectionTitle>
            <span id="incluido">
              O que está <span className="text-accent">incluído</span>
            </span>
          </SectionTitle>
          <ul className="grid gap-4 sm:grid-cols-2">
            {INCLUDED.map((item) => {
              const Icon = INCLUDED_ICONS[item.icon];
              return (
                <li key={item.title} className="rounded-card border-border bg-surface border p-5">
                  <Icon className="text-accent size-6" aria-hidden />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="text-muted mt-1 text-sm leading-relaxed">{item.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {plan ? (
          <section
            aria-labelledby="plano"
            className="rounded-card border-accent/40 bg-surface flex flex-col border p-6 sm:p-8"
          >
            <p id="plano" className="text-accent text-sm font-semibold tracking-wide uppercase">
              {plan.name}
            </p>
            <p className="mt-2 text-4xl font-bold">
              {formatMoney(plan.priceCents)}{" "}
              <span className="text-muted text-base font-normal">/ mês</span>
            </p>
            <ul className="mt-6 flex flex-col gap-3 text-sm">
              {[
                `Até ${plan.maxCourses} disciplinas à sua escolha`,
                "Todas as aulas, atividades e materiais dessas disciplinas",
                "Cancele quando quiser",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="text-success size-5 shrink-0" aria-hidden /> {item}
                </li>
              ))}
            </ul>
            <ButtonLink href="/assinar" className="mt-8">
              Quero assinar
            </ButtonLink>
          </section>
        ) : null}
      </Container>

      {/* 7. Sobre o professor (resumo) */}
      {profile ? (
        <Container className="mt-20">
          <section className="rounded-card border-border bg-surface flex flex-col items-start gap-6 border p-6 sm:flex-row sm:items-center sm:p-8">
            {profilePhotoUrl(profile) ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL do storage ou link externo
              <img
                src={profilePhotoUrl(profile) ?? undefined}
                alt={`Foto de ${profile.fullName}`}
                className="border-accent/40 size-24 shrink-0 rounded-full border object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="bg-accent/15 text-accent flex size-24 shrink-0 items-center justify-center rounded-full text-3xl font-bold"
              >
                {profile.fullName.charAt(0)}
              </span>
            )}
            <div className="flex-1">
              <p className="text-muted text-sm">Quem dá as aulas</p>
              <h2 className="text-2xl font-bold">{profile.fullName}</h2>
              <p className="text-accent font-medium">{profile.headline}</p>
              <p className="text-muted mt-2 max-w-2xl text-sm leading-relaxed">
                {profile.shortBio}
              </p>
            </div>
            <ButtonLink href="/sobre-o-professor" variant="outline" className="shrink-0">
              Conhecer o professor
            </ButtonLink>
          </section>
        </Container>
      ) : null}

      {/* Catálogo: as disciplinas publicadas */}
      {courses.length ? (
        <Container className="mt-20">
          <SectionTitle
            action={
              <Link
                href="/aulas"
                className="text-accent inline-flex items-center gap-1 text-sm hover:underline"
              >
                Ver catálogo completo <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          >
            Disciplinas <span className="text-accent">disponíveis</span>
          </SectionTitle>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course) => (
              <li key={course.id}>
                <CourseCard course={course} />
              </li>
            ))}
          </ul>
        </Container>
      ) : null}

      {/* 8. Chamada final */}
      <Container className="mt-20">
        <section className="rounded-card border-accent/30 from-surface to-surface-2 relative overflow-hidden border bg-gradient-to-br p-8 text-center sm:p-12">
          <Atom
            aria-hidden
            className="orbit-spin text-accent/10 absolute -right-10 -bottom-10 size-64"
          />
          <h2 className="relative text-3xl font-bold">{FINAL_CTA.title}</h2>
          <p className="text-muted relative mx-auto mt-3 max-w-xl">{FINAL_CTA.text}</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-4">
            <ButtonLink href="/assinar">Assinar agora</ButtonLink>
            <ButtonLink href="/aulas" variant="outline">
              Ver aulas grátis
            </ButtonLink>
          </div>
        </section>
      </Container>
    </>
  );
}
