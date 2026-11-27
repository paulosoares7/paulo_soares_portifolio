import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { buttonClasses, ButtonLink } from "@portfolio/ui/Button";
import { Container, PageTitle } from "@portfolio/ui/Container";
import { SocialIcon, SocialLinks } from "@portfolio/ui/SocialIcon";
import { getProfessorSummary, profilePhotoUrl } from "@/lib/home";
import { portfolioUrl } from "@/lib/links";
import { getSiteIdentity } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sobre o professor",
  description: "Quem prepara e grava as aulas da plataforma.",
};

/**
 * Sobre o professor: resumo do perfil, números de destaque, redes sociais e o
 * link para o portfólio completo (NEXT_PUBLIC_PORTFOLIO_URL).
 */
export default async function ProfessorPage() {
  const [{ profile, highlights }, identity] = await Promise.all([
    getProfessorSummary(),
    getSiteIdentity(),
  ]);
  const name = profile?.fullName || identity.displayName;
  const lattesUrl =
    profile?.lattesUrl || identity.socialLinks.find((l) => l.network === "lattes")?.url || null;

  return (
    <Container>
      <PageTitle title="Sobre o" accent="professor" />
      <section className="rounded-card border-border bg-surface grid gap-8 border p-6 sm:p-10 md:grid-cols-[auto_1fr]">
        {profilePhotoUrl(profile) ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL do storage ou link externo
          <img
            src={profilePhotoUrl(profile) ?? undefined}
            alt={`Foto de ${name}`}
            className="border-accent/40 size-40 rounded-full border object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="bg-accent/15 text-accent flex size-40 items-center justify-center rounded-full text-5xl font-bold shadow-[0_0_80px_rgba(14,165,233,0.25)]"
          >
            {name.charAt(0)}
          </span>
        )}
        <div>
          <h2 className="text-3xl font-bold">{name}</h2>
          {profile?.headline ? (
            <p className="text-accent mt-1 text-lg font-semibold">{profile.headline}</p>
          ) : null}
          {profile?.shortBio ? (
            <p className="text-muted mt-4 max-w-2xl leading-relaxed">{profile.shortBio}</p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={portfolioUrl()} className={buttonClasses()}>
              Ver portfólio completo <ArrowUpRight className="size-4" aria-hidden />
            </a>
            {lattesUrl ? (
              <a
                href={lattesUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Currículo Lattes (abre em nova aba)"
                className={buttonClasses("outline")}
              >
                <SocialIcon network="lattes" className="size-4" /> Currículo Lattes
              </a>
            ) : null}
          </div>

          <div className="mt-8">
            <SocialLinks links={identity.socialLinks} />
          </div>
        </div>
      </section>

      {highlights.length ? (
        <ul className="rounded-card border-border bg-surface mt-8 grid border sm:grid-cols-3">
          {highlights.map((item) => (
            <li
              key={item.id}
              className="border-border border-b p-6 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0"
            >
              <p className="text-accent text-3xl font-bold">{item.value}</p>
              <p className="text-muted mt-1 text-sm">{item.label}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/aulas">Ver as aulas</ButtonLink>
        <a href={portfolioUrl("/contato")} className={buttonClasses("outline")}>
          Fale com o professor
        </a>
      </div>
    </Container>
  );
}
