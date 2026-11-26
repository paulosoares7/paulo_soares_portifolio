import { Skeleton } from "@/components/ui/Skeleton";

/** Carregamento das telas do painel: título e linhas de tabela. */
export default function Loading() {
  return (
    <div>
      <p role="status" className="sr-only">
        Carregando...
      </p>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-3 h-4 w-full max-w-md" />
      <div className="rounded-card border-border bg-surface mt-6 flex flex-col gap-3 border p-5">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
