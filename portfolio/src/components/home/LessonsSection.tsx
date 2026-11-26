import { Atom, BookOpen, GraduationCap, Landmark, PlayCircle, School } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { buttonClasses } from "@portfolio/ui/Button";
import { Container } from "@portfolio/ui/Container";
import { plural } from "@/lib/format";
import { plataformaUrl } from "@/lib/links";

// Ícone de cada grupo do catálogo (slug de categories); outro slug usa o livro.
const GROUP_ICONS: Record<string, LucideIcon> = {
  vestibulares: GraduationCap,
  "ensino-medio": School,
  "ensino-superior": Atom,
  concursos: Landmark,
};

type LessonsSectionProps = {
  groups: { id: number; slug: string; name: string; courses: number }[];
  freeLessons: number;
};

/**
 * Seção "Aulas" da home: título, uma frase, os grupos do catálogo e o botão
 * para a plataforma (outro projeto, em NEXT_PUBLIC_PLATAFORMA_URL).
 */
export function LessonsSection({ groups, freeLessons }: LessonsSectionProps) {
  return (
    <Container className="mt-20">
      <section
        aria-labelledby="aulas-titulo"
        className="rounded-card border-accent/30 from-surface to-surface-2 relative overflow-hidden border bg-gradient-to-br p-8 sm:p-12"
      >
        <Atom
          aria-hidden
          className="orbit-spin text-accent/10 absolute -right-10 -bottom-10 size-64"
        />
        <p className="text-accent text-sm font-semibold tracking-wide uppercase">Aulas</p>
        <h2 id="aulas-titulo" className="mt-2 max-w-xl text-3xl font-bold">
          Física para estudar do seu jeito
        </h2>
        <p className="text-muted mt-3 max-w-xl">
          Videoaulas, notas de aula e atividades com correção automática.{" "}
          {freeLessons
            ? `Comece pelas ${plural(freeLessons, "aula grátis", "aulas grátis")}.`
            : null}
        </p>

        {groups.length ? (
          <ul className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => {
              const Icon = GROUP_ICONS[group.slug] ?? BookOpen;
              return (
                <li key={group.id}>
                  <a
                    href={plataformaUrl(`/aulas/${group.slug}`)}
                    className="rounded-card border-border bg-bg/60 hover:border-accent/60 flex h-full items-center gap-3 border p-4 transition-colors"
                  >
                    <span className="bg-accent/10 text-accent flex size-10 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold">{group.name}</span>
                      <span className="text-muted text-xs">
                        {group.courses
                          ? plural(group.courses, "disciplina", "disciplinas")
                          : "em breve"}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        ) : null}

        <a href={plataformaUrl()} className={`${buttonClasses()} relative mt-8`}>
          <PlayCircle className="size-4" aria-hidden /> Conhecer as aulas
        </a>
      </section>
    </Container>
  );
}
