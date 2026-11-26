import { ArrowRight, FileDown } from "lucide-react";
import { ButtonLink, buttonClasses } from "@portfolio/ui/Button";
import { Container } from "@portfolio/ui/Container";
import { SocialIcon, SocialLinks, type SocialLinkItem } from "@portfolio/ui/SocialIcon";

type HeroProps = {
  fullName: string;
  headline: string;
  shortBio: string;
  photoUrl: string | null;
  cvUrl: string | null;
  /** Link do Currículo Lattes (perfil); sem ele, o botão some. */
  lattesUrl: string | null;
  /** Redes do painel já com o atalho "Aulas". */
  socialLinks: SocialLinkItem[];
};

/**
 * Abertura da home no estilo do modelo Jacob: saudação, nome grande, título em
 * ciano, bio curta, botões (contato, currículo e Lattes), redes e a foto com
 * recorte em degradê.
 */
export function Hero({
  fullName,
  headline,
  shortBio,
  photoUrl,
  cvUrl,
  lattesUrl,
  socialLinks,
}: HeroProps) {
  const name = fullName;
  return (
    <section className="relative overflow-hidden">
      {/* Brilho ciano de fundo, como o rosto iluminado do modelo. */}
      <div
        aria-hidden
        className="bg-accent/10 pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full blur-3xl"
      />
      <Container className="grid items-center gap-10 py-14 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="relative z-10">
          <p className="text-muted text-lg">Olá, eu sou</p>
          <h1 className="mt-1 text-4xl leading-tight font-bold sm:text-5xl">{name}</h1>
          <p className="text-accent mt-2 text-xl font-semibold sm:text-2xl">{headline}</p>
          <p className="text-muted mt-5 max-w-xl leading-relaxed">{shortBio}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <ButtonLink href="/contato">
              Fale comigo <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
            {cvUrl ? (
              <a
                href={cvUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("outline")}
              >
                <FileDown className="size-4" aria-hidden /> Baixar currículo
              </a>
            ) : (
              <ButtonLink href="/sobre" variant="outline">
                Ver currículo
              </ButtonLink>
            )}
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
          <div className="mt-10">
            <SocialLinks links={socialLinks} />
          </div>
        </div>
        <HeroPortrait photoUrl={photoUrl} name={name} />
      </Container>
    </section>
  );
}

/** Foto com recorte em degradê; sem foto, uma órbita (átomo) com as iniciais. */
function HeroPortrait({ photoUrl, name }: { photoUrl: string | null; name: string }) {
  if (photoUrl) {
    return (
      <div className="relative mx-auto aspect-[4/5] w-full max-w-sm md:max-w-md">
        {/* eslint-disable-next-line @next/next/no-img-element -- URL pública do storage */}
        <img
          src={photoUrl}
          alt={`Foto de ${name}`}
          className="h-full w-full [mask-image:linear-gradient(to_bottom,black_60%,transparent),linear-gradient(to_left,black_70%,transparent)] [mask-composite:intersect] object-cover"
        />
      </div>
    );
  }
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return (
    <div
      aria-hidden
      className="relative mx-auto hidden aspect-square w-full max-w-sm items-center justify-center md:flex"
    >
      <div className="orbit-spin border-accent/30 absolute inset-0 rounded-full border" />
      <div className="orbit-spin-reverse border-accent/40 absolute inset-8 rotate-60 [transform:rotateX(65deg)] rounded-[50%] border" />
      <div className="orbit-spin border-accent/30 absolute inset-16 rounded-full border border-dashed" />
      <div className="bg-accent/15 text-accent relative flex size-32 items-center justify-center rounded-full text-4xl font-bold shadow-[0_0_80px_rgba(14,165,233,0.35)]">
        {initials}
        <span className="text-text">.</span>
      </div>
    </div>
  );
}
