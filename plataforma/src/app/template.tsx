/** Envolve cada página: a troca de página entra com uma transição curta (theme.css). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
