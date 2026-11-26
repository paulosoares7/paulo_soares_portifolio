import Link from "next/link";
import { UserRound } from "lucide-react";
import { TopNav } from "@/components/layout/NavLinks";
import { Container } from "@portfolio/ui/Container";

/**
 * Cabeçalho da plataforma: nome com ponto ciano e o selo "Aulas", menu e o
 * acesso à área do aluno.
 */
export function SiteHeader({ displayName }: { displayName: string }) {
  // O nome do perfil já costuma terminar em ponto ("Paulo."); o ponto vira ciano.
  const name = displayName.replace(/\.$/, "");
  return (
    <header className="border-border/50 bg-bg/85 sticky top-0 z-40 border-b backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2 text-xl font-bold tracking-tight">
          <span>
            {name}
            <span className="text-accent">.</span>
          </span>
          <span className="text-accent text-xs font-semibold tracking-wide uppercase">Aulas</span>
        </Link>
        <TopNav />
        <Link
          href="/minha-area"
          className="border-accent/60 text-accent hover:bg-accent hover:text-bg rounded-btn hidden h-9 items-center gap-2 border px-3 text-sm font-medium transition-colors md:inline-flex"
        >
          <UserRound className="size-4" aria-hidden /> Minha área
        </Link>
        <Link href="/aulas" className="text-accent text-sm font-medium md:hidden">
          Aulas
        </Link>
      </Container>
    </header>
  );
}
