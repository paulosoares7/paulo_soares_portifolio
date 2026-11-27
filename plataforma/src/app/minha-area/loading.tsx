import { Container } from "@portfolio/ui/Container";
import { Skeleton } from "@portfolio/ui/Skeleton";

/** Carregamento do painel do aluno: título, números e os cartões. */
export default function Loading() {
  return (
    <Container className="py-10">
      <p role="status" className="sr-only">
        Carregando o seu painel...
      </p>
      <Skeleton className="h-10 w-56" />
      <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Skeleton className="rounded-card h-28" />
        <Skeleton className="rounded-card h-28" />
        <Skeleton className="rounded-card h-28" />
        <Skeleton className="rounded-card h-28" />
      </div>
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
