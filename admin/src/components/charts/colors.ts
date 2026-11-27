// Cores das séries dos gráficos, em ordem fixa (a série 1 é sempre azul).
// Os valores ficam em packages/ui/src/tokens.css (--color-chart-*); aqui só
// as referências, para os gráficos acompanharem o tema.
export const SERIES_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
] as const;
