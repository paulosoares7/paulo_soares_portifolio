import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Atom, Construction } from "lucide-react";
import { buttonClasses } from "@portfolio/ui/Button";
import { Container } from "@portfolio/ui/Container";
import { PLATAFORMA_ONLINE, PLATAFORMA_URL } from "@/lib/links";

export const metadata: Metadata = {
  title: "Aulas em desenvolvimento",
  description: "A plataforma de aulas de Física está em desenvolvimento.",
  // Página provisória: fora dos buscadores até a plataforma entrar no ar.
  robots: { index: false },
};

/**
 * Aviso "Aulas em desenvolvimento", para onde vão os links "Aulas" enquanto
 * NEXT_PUBLIC_PLATAFORMA_URL está vazia. Com o endereço preenchido, esta
 * página só redireciona para a plataforma (links antigos continuam valendo).
 */
export default function LessonsSoonPage() {
  if (PLATAFORMA_ONLINE) redirect(PLATAFORMA_URL);

  return (
    <Container className="py-16 md:py-24">
      <section
        aria-labelledby="aulas-titulo"
        className="rounded-card border-accent/30 from-surface to-surface-2 relative mx-auto max-w-2xl overflow-hidden border bg-gradient-to-br p-8 text-center sm:p-12"
      >
        <Atom
          aria-hidden
          className="orbit-spin text-accent/10 absolute -right-10 -bottom-10 size-56"
        />
        <span className="border-accent/40 bg-accent/10 text-accent relative mx-auto flex size-16 items-center justify-center rounded-full border">
          <Construction className="size-7" aria-hidden />
        </span>
        <p className="text-accent relative mt-6 text-sm font-semibold tracking-wide uppercase">
          Aulas
        </p>
        <h1 id="aulas-titulo" className="relative mt-2 text-3xl font-bold sm:text-4xl">
          Em desenvolvimento
        </h1>
        <p className="text-muted relative mx-auto mt-4 max-w-lg leading-relaxed">
          Estou preparando uma plataforma de aulas de Física com videoaulas, notas de aula e
          atividades com correção automática. Em breve ela estará disponível aqui.
        </p>
        <p className="text-muted relative mx-auto mt-2 max-w-lg leading-relaxed">
          Quer ser avisado quando abrir ou tem alguma dúvida? Mande uma mensagem.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/contato" className={buttonClasses()}>
            Fale comigo
          </Link>
          <Link href="/publicacoes" className={buttonClasses("outline")}>
            Ver publicações
          </Link>
        </div>
      </section>
    </Container>
  );
}
