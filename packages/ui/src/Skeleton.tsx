/**
 * Bloco cinza "pulsando" que ocupa o lugar do conteúdo enquanto ele carrega.
 * Fica oculto para leitores de tela: quem anuncia o carregamento é o loading.tsx.
 * @param className Tamanho e forma (ex.: "h-6 w-40").
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`bg-surface-2 rounded-btn animate-pulse motion-reduce:animate-none ${className}`}
    />
  );
}
