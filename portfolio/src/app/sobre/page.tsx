import type { Metadata } from "next";
import { FileDown, FlaskConical } from "lucide-react";
import { Timeline, type TimelineItem } from "@/components/about/Timeline";
import { ToolsOrbit } from "@/components/about/ToolsOrbit";
import { buttonClasses } from "@portfolio/ui/Button";
import { Container, PageTitle, SectionTitle } from "@portfolio/ui/Container";
import { Markdown } from "@portfolio/ui/Markdown";
import { DEGREE_LEVELS } from "@/lib/labels";
import { getAboutData } from "@/lib/portfolio";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sobre",
  description: "Formação, atuação profissional, áreas de pesquisa e ferramentas.",
};

const yearFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Período "2019 – 2023", "2025 – atual" ou só o que houver. */
function period(
  start: number | string | null,
  end: number | string | null,
  ongoing: boolean,
): string {
  if (start && (end || ongoing)) return `${start} – ${end ?? "atual"}`;
  if (end) return String(end);
  return ongoing ? "Atual" : "";
}

/** Sobre (RF02): bio, formação e atuação em linha do tempo, pesquisa e ferramentas. */
export default async function AboutPage() {
  const { profile, degrees, experiences, areas, tools } = await getAboutData();
  const name = profile?.fullName ?? "";

  const degreeItems: TimelineItem[] = degrees.map((d) => ({
    id: d.id,
    period: period(d.startYear, d.endYear, d.status === "in_progress") || DEGREE_LEVELS[d.level],
    title: d.course,
    subtitle: `${DEGREE_LEVELS[d.level]} · ${d.institution}`,
    detail: d.thesisTitle ? (
      <>
        “{d.thesisTitle}”{d.advisor ? ` — orientação: ${d.advisor}` : ""}
      </>
    ) : null,
  }));

  const experienceItems: TimelineItem[] = experiences.map((e) => ({
    id: e.id,
    period: period(
      e.startDate ? yearFormatter.format(e.startDate) : null,
      e.endDate ? yearFormatter.format(e.endDate) : null,
      !e.endDate,
    ),
    title: e.role,
    subtitle: e.institution,
    detail: e.description,
  }));

  return (
    <Container>
      <PageTitle title="Sobre" accent="mim" description={profile?.headline} />

      <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          {profile?.longBio ? (
            <Markdown source={profile.longBio} className="text-muted" />
          ) : (
            <p className="text-muted leading-relaxed">{profile?.shortBio}</p>
          )}
          {profile?.cvFile?.publicUrl || profile?.lattesUrl ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {profile.cvFile?.publicUrl ? (
                <a
                  href={profile.cvFile.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("primary")}
                >
                  <FileDown className="size-4" aria-hidden /> Baixar currículo
                </a>
              ) : null}
              {profile.lattesUrl ? (
                <a
                  href={profile.lattesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("outline")}
                >
                  Currículo Lattes
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <div>
          <SectionTitle>Áreas de pesquisa</SectionTitle>
          <ul className="flex flex-col gap-3">
            {areas.map((area) => (
              <li
                key={area.id}
                className="rounded-card border-border bg-surface flex gap-3 border p-4"
              >
                <FlaskConical className="text-accent mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-medium">{area.name}</p>
                  {area.description ? (
                    <p className="text-muted mt-1 text-sm">{area.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 grid gap-12 md:grid-cols-2">
        <section aria-labelledby="formacao">
          <SectionTitle>
            <span id="formacao">Formação</span>
          </SectionTitle>
          <Timeline items={degreeItems} empty="Formação ainda não cadastrada." />
        </section>
        <section aria-labelledby="atuacao">
          <SectionTitle>
            <span id="atuacao">Atuação profissional</span>
          </SectionTitle>
          <Timeline items={experienceItems} empty="Atuação ainda não cadastrada." />
        </section>
      </div>

      <div className="mt-16">
        <ToolsOrbit tools={tools} monogram={name.trim()[0]?.toUpperCase() ?? "P"} />
      </div>
    </Container>
  );
}
