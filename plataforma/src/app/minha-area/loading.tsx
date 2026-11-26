import { Container } from "@portfolio/ui/Container";
import { Skeleton } from "@portfolio/ui/Skeleton";

/** Carregamento da Minha área: título e os cartões do painel do aluno. */
export default function Loading() {
  return (
    <Container className="py-10">
      <p role="status" className="sr-only">
        Carregando a sua área...
      </p>
      <Skeleton className="h-10 w-56" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Skeleton className="rounded-card h-72" />
        <Skeleton className="rounded-card h-72" />
        <Skeleton className="rounded-card h-64" />
        <Skeleton className="rounded-card h-64" />
        <Skeleton className="rounded-card h-40" />
        <Skeleton className="rounded-card h-40" />
      </div>
    </Container>
  );
}
