import Link from "next/link";
import { Container } from "@portfolio/ui/Container";
import { SocialLinks } from "@portfolio/ui/SocialIcon";
import { portfolioUrl } from "@/lib/links";
import type { SiteIdentity } from "@/lib/site";

/** Rodapé com redes, atalhos e o link para o portfólio. O espaço extra no celular evita o menu inferior. */
export function SiteFooter({ identity }: { identity: SiteIdentity }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-border mt-20 border-t pb-24 md:pb-0">
      <Container className="flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">{identity.fullName || identity.displayName}</p>
          <p className="text-muted text-sm">{identity.headline}</p>
        </div>
        <SocialLinks links={identity.socialLinks} size="sm" />
      </Container>
      <Container className="border-border/50 text-muted flex flex-wrap gap-x-6 gap-y-2 border-t py-6 text-xs">
        <span>© {year}</span>
        <Link href="/aulas" className="hover:text-accent">
          Aulas
        </Link>
        <Link href="/assinar" className="hover:text-accent">
          Assinar
        </Link>
        <Link href="/sobre-o-professor" className="hover:text-accent">
          Sobre o professor
        </Link>
        <a href={portfolioUrl()} className="hover:text-accent">
          Portfólio
        </a>
        <a href={portfolioUrl("/contato")} className="hover:text-accent">
          Contato
        </a>
      </Container>
    </footer>
  );
}
