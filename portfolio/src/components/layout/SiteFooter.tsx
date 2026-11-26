import Link from "next/link";
import { Container } from "@portfolio/ui/Container";
import { SocialLinks } from "@portfolio/ui/SocialIcon";
import { plataformaUrl } from "@/lib/links";
import { type SiteIdentity, withLessonsLink } from "@/lib/site";

/** Rodapé com redes, o atalho "Aulas" e os links do portfólio. O espaço extra no celular evita o menu inferior. */
export function SiteFooter({ identity }: { identity: SiteIdentity }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-border mt-20 border-t pb-24 md:pb-0">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{identity.fullName || identity.displayName}</p>
          <p className="text-muted text-sm">{identity.headline}</p>
        </div>
        <SocialLinks links={withLessonsLink(identity.socialLinks)} size="sm" />
      </Container>
      <Container className="border-border/50 text-muted flex flex-wrap gap-x-6 gap-y-2 border-t py-6 text-xs">
        <span>© {year}</span>
        <Link href="/sobre" className="hover:text-accent">
          Sobre
        </Link>
        <Link href="/publicacoes" className="hover:text-accent">
          Publicações
        </Link>
        <a href={plataformaUrl()} className="hover:text-accent">
          Aulas
        </a>
        <Link href="/contato" className="hover:text-accent">
          Contato
        </Link>
      </Container>
    </footer>
  );
}
