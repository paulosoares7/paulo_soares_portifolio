import Link from "next/link";
import { TopNav } from "@/components/layout/NavLinks";
import { UserMenu } from "@/components/layout/UserMenu";
import { Container } from "@portfolio/ui/Container";

/**
 * Cabeçalho da plataforma: nome com ponto ciano e o selo "Aulas", menu e o
 * avatar do aluno (ou "Entrar").
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
        <UserMenu />
      </Container>
    </header>
  );
}
