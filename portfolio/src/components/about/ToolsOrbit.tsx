/**
 * "Constelação" de ferramentas (inspiração 02): nomes em pílulas no alto,
 * linhas descendo até um núcleo brilhante com órbitas.
 */
export function ToolsOrbit({ tools, monogram }: { tools: string[]; monogram: string }) {
  if (tools.length === 0) return null;
  return (
    <section
      aria-labelledby="ferramentas"
      className="rounded-card border-border bg-surface-2 relative overflow-hidden border px-4 pt-10 pb-0 text-center"
    >
      <h2 id="ferramentas" className="text-2xl font-semibold">
        Ferramentas que uso nas <span className="text-accent">aulas</span>
      </h2>
      <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
        {tools.map((tool) => (
          <li
            key={tool}
            className="border-accent/40 bg-accent/10 text-accent rounded-full border px-3 py-1 text-sm"
          >
            {tool}
          </li>
        ))}
      </ul>
      <div aria-hidden className="relative mx-auto mt-6 h-56 max-w-xl">
        {/* Linhas da constelação convergindo para o núcleo. */}
        <svg
          viewBox="0 0 400 120"
          className="text-accent/30 absolute inset-x-0 top-0 h-28 w-full"
          preserveAspectRatio="none"
        >
          {[20, 80, 140, 200, 260, 320, 380].map((x) => (
            <path
              key={x}
              d={`M${x} 0 Q ${(x + 200) / 2} 70 200 120`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
          ))}
        </svg>
        <div className="border-accent/20 absolute bottom-[-120px] left-1/2 h-[240px] w-[520px] -translate-x-1/2 rounded-[50%] border" />
        <div className="border-accent/25 absolute bottom-[-90px] left-1/2 h-[180px] w-[400px] -translate-x-1/2 rounded-[50%] border" />
        <div className="border-accent/30 absolute bottom-[-60px] left-1/2 h-[120px] w-[280px] -translate-x-1/2 rounded-[50%] border" />
        <div className="bg-accent/20 text-accent shadow-glow-strong absolute bottom-4 left-1/2 flex size-24 -translate-x-1/2 items-center justify-center rounded-full text-3xl font-bold">
          {monogram}
          <span className="text-text">.</span>
        </div>
      </div>
    </section>
  );
}
