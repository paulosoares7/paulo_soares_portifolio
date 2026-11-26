import { Container } from "@portfolio/ui/Container";
import { Skeleton } from "@portfolio/ui/Skeleton";

/** Carregamento padrão do portfólio: título e blocos de texto. */
export default function Loading() {
  return (
    <Container className="py-10">
      <p role="status" className="sr-only">
        Carregando...
      </p>
      <Skeleton className="h-10 w-64" />
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    </Container>
  );
}
