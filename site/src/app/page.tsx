import Link from "next/link";
import { ArrowRight, Atom, PlayCircle } from "lucide-react";
import { Highlights } from "@/components/home/Highlights";
import { Hero } from "@/components/home/Hero";
import { PublicationCard } from "@/components/publications/PublicationCard";
import { ButtonLink } from "@/components/ui/Button";
import { Container, SectionTitle } from "@/components/ui/Container";
import { plural } from "@/lib/format";
import { getHomeData } from "@/lib/portfolio";
import { getSiteIdentity } from "@/lib/site";

// Conteúdo vem do painel; revalida a cada 5 min sem precisar de novo deploy.
export const revalidate = 300;

/** Home (RF01): apresentação, números, publicações em destaque e chamada para as aulas. */
export default async function HomePage() {
  const [{ profile, highlights, featured, courses, freeLessons }, identity] = await Promise.all([
    getHomeData(),
    getSiteIdentity(),
  ]);

  return (
    <>
      <Hero
        fullName={profile?.fullName ?? identity.displayName}
        headline={profile?.headline ?? ""}
        shortBio={profile?.shortBio ?? ""}
        photoUrl={profile?.photoFile?.publicUrl ?? null}
        cvUrl={profile?.cvFile?.publicUrl ?? null}
        socialLinks={identity.socialLinks}
      />

      <Highlights items={highlights} />

      {featured.length ? (
        <Container className="mt-20">
          <SectionTitle
            action={
              <Link
                href="/publicacoes"
                className="text-accent inline-flex items-center gap-1 text-sm hover:underline"
              >
                Todas as publicações <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          >
            Publicações em <span className="text-accent">destaque</span>
          </SectionTitle>
          <ul className="grid gap-5 md:grid-cols-3">
            {featured.map((p) => (
              <li key={p.id}>
                <PublicationCard publication={p} />
              </li>
            ))}
          </ul>
        </Container>
      ) : null}

      <Container className="mt-20">
        <section className="rounded-card border-accent/30 from-surface to-surface-2 relative overflow-hidden border bg-gradient-to-br p-8 sm:p-12">
          <Atom
            aria-hidden
            className="orbit-spin text-accent/10 absolute -right-10 -bottom-10 size-64"
          />
          <p className="text-accent text-sm font-semibold tracking-wide uppercase">
            Aulas de Física
          </p>
          <h2 className="mt-2 max-w-xl text-3xl font-bold">
            Vestibulares, Ensino Médio, Ensino Superior e Concursos
          </h2>
          <p className="text-muted mt-3 max-w-xl">
            {plural(courses, "disciplina publicada", "disciplinas publicadas")}, com videoaulas,
            notas de aula e atividades.{" "}
            {freeLessons
              ? `Comece pelas ${plural(freeLessons, "aula grátis", "aulas grátis")}, sem cadastro.`
              : null}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href="/aulas">
              <PlayCircle className="size-4" aria-hidden /> Ver aulas
            </ButtonLink>
            <ButtonLink href="/assinar" variant="outline">
              Como assinar
            </ButtonLink>
          </div>
        </section>
      </Container>
    </>
  );
}
