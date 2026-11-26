import { Container } from "@portfolio/ui/Container";
import { Skeleton } from "@portfolio/ui/Skeleton";

/** Carregamento padrão: título e blocos de texto no lugar da página. */
export default function Loading() {
  return (
    <Container className="py-10">
      <p role="status" className="sr-only">
        Carregando...
      </p>
      <Skeleton className="h-10 w-64" />
      <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="rounded-card h-44" />
        ))}
      </div>
    </Container>
  );
}
