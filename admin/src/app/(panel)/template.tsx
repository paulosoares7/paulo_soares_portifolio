/** Envolve cada tela do painel: a troca de tela entra com uma transição curta (globals.css). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
