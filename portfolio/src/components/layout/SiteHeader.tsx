import Link from "next/link";
import { TopNav } from "@/components/layout/NavLinks";
import { Container } from "@portfolio/ui/Container";
import { plataformaUrl } from "@/lib/links";

/** Cabeçalho: nome curto com ponto ciano à esquerda (como "Jacob.") e menu à direita. */
export function SiteHeader({ displayName }: { displayName: string }) {
  // O nome do perfil já costuma terminar em ponto ("Paulo."); o ponto vira ciano.
  const name = displayName.replace(/\.$/, "");
  return (
    <header className="border-border/50 bg-bg/85 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          {name}
          <span className="text-accent">.</span>
        </Link>
        <TopNav />
        <a href={plataformaUrl()} className="text-accent text-sm font-medium md:hidden">
          Aulas
        </a>
      </Container>
    </header>
  );
}
