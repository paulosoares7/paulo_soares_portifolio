import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Highlights } from "@/components/home/Highlights";
import { Hero } from "@/components/home/Hero";
import { LessonsSection } from "@/components/home/LessonsSection";
import { PublicationCard } from "@/components/publications/PublicationCard";
import { Container, SectionTitle } from "@portfolio/ui/Container";
import { getHomeData } from "@/lib/portfolio";
import { getSiteIdentity, withLessonsLink } from "@/lib/site";

// Conteúdo vem do painel; revalida a cada 5 min sem precisar de novo deploy.
export const revalidate = 300;

/** Home (RF01): apresentação, números, publicações em destaque e a seção de aulas. */
export default async function HomePage() {
  const [{ profile, highlights, featured, freeLessons, categories }, identity] = await Promise.all([
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
        lattesUrl={
          profile?.lattesUrl ||
          identity.socialLinks.find((l) => l.network === "lattes")?.url ||
          null
        }
        socialLinks={withLessonsLink(identity.socialLinks)}
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

      <LessonsSection groups={categories} freeLessons={freeLessons} />
    </>
  );
}
