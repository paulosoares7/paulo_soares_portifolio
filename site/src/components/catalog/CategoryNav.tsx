import Link from "next/link";

/** Abas das seções do catálogo (rolam na horizontal no celular). */
export function CategoryNav({
  categories,
  active,
}: {
  categories: { slug: string; name: string; count: number }[];
  active?: string;
}) {
  const tab = (isActive: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? "border-accent bg-accent text-bg"
        : "border-border text-muted hover:border-accent hover:text-text"
    }`;
  return (
    <nav aria-label="Seções do catálogo" className="-mx-4 mb-10 overflow-x-auto px-4">
      <ul className="flex gap-2">
        <li>
          <Link href="/aulas" aria-current={!active ? "page" : undefined} className={tab(!active)}>
            Todas
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/aulas/${c.slug}`}
              aria-current={active === c.slug ? "page" : undefined}
              className={tab(active === c.slug)}
            >
              {c.name} <span className="opacity-70">({c.count})</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
