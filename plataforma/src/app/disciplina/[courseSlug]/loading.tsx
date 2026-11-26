import { Container } from "@portfolio/ui/Container";
import { Skeleton } from "@portfolio/ui/Skeleton";

/** Carregamento da disciplina: caminho, cabeçalho e a lista de aulas. */
export default function Loading() {
  return (
    <Container className="py-8">
      <p role="status" className="sr-only">
        Carregando a disciplina...
      </p>
      <Skeleton className="h-4 w-72" />
      <div className="mt-6 flex items-center gap-5">
        <Skeleton className="rounded-card size-16 shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-9 w-60" />
          <Skeleton className="mt-3 h-4 w-full max-w-lg" />
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    </Container>
  );
}
