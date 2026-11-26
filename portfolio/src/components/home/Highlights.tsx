import { Container } from "@portfolio/ui/Container";

/**
 * Faixa de números de destaque (modelo do UI designer): valor em ciano e
 * rótulo embaixo, separados por linhas verticais.
 */
export function Highlights({ items }: { items: { id: number; value: string; label: string }[] }) {
  if (items.length === 0) return null;
  return (
    <Container>
      <ul className="divide-border rounded-card border-border bg-surface grid grid-cols-1 divide-y border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((item) => (
          <li key={item.id} className="px-6 py-6">
            <p className="text-accent text-3xl font-bold">{item.value}</p>
            <p className="text-muted mt-1 text-sm">{item.label}</p>
          </li>
        ))}
      </ul>
    </Container>
  );
}
