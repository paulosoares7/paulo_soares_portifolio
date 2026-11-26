"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, House, UserRound, UserSquare } from "lucide-react";

const TOP_LINKS = [
  { href: "/", label: "Início" },
  { href: "/aulas", label: "Aulas" },
  { href: "/sobre-o-professor", label: "Sobre o professor" },
  { href: "/assinar", label: "Assinar" },
];

// Menu inferior do celular: Início, Aulas, Professor e Minha área.
const BOTTOM_LINKS = [
  { href: "/", label: "Início", icon: House },
  { href: "/aulas", label: "Aulas", icon: BookOpen },
  { href: "/sobre-o-professor", label: "Professor", icon: UserSquare },
  { href: "/minha-area", label: "Minha área", icon: UserRound },
];

/**
 * Diz se o link corresponde à página atual (aulas inclui disciplina e aula).
 * @param pathname Caminho atual.
 * @param href Destino do link.
 * @returns true se for a seção ativa.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/aulas")
    return (
      pathname.startsWith("/aulas") ||
      pathname.startsWith("/disciplina") ||
      pathname.startsWith("/atividades")
    );
  if (href === "/minha-area")
    return ["/minha-area", "/entrar", "/cadastrar"].some((p) => pathname.startsWith(p));
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Links do cabeçalho (computador), com o ativo em ciano como no modelo Jacob. */
export function TopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="hidden md:block">
      <ul className="flex items-center gap-8 text-sm font-medium">
        {TOP_LINKS.map(({ href, label }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={active ? "text-accent" : "text-text hover:text-accent"}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Menu inferior fixo no celular. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navegação inferior"
      className="border-border bg-surface/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4 pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${active ? "text-accent" : "text-muted"}`}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
