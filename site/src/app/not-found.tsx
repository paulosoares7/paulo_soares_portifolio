import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/** Página 404. */
export default function NotFound() {
  return (
    <Container className="flex flex-col items-start gap-4 py-24">
      <p className="text-accent text-sm font-semibold">404</p>
      <h1 className="text-3xl font-bold">Página não encontrada</h1>
      <p className="text-muted">
        O endereço pode ter mudado ou o conteúdo ainda não foi publicado.
      </p>
      <ButtonLink href="/">Voltar ao início</ButtonLink>
    </Container>
  );
}
