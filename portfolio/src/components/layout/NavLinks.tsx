"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, House, Library, Mail, UserRound } from "lucide-react";
import { PLATAFORMA_ONLINE, plataformaUrl } from "@/lib/links";

// "Aulas" leva à plataforma (outro projeto): link comum <a>, não <Link>.
// Com a plataforma fora do ar, leva à página /aulas deste portfólio (aviso).
const LESSONS_EXTERNAL = PLATAFORMA_ONLINE;
const TOP_LINKS = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/publicacoes", label: "Publicações" },
  { href: plataformaUrl(), label: "Aulas", external: LESSONS_EXTERNAL },
  { href: "/contato", label: "Contato" },
];

// Menu inferior do celular: as páginas do portfólio e o atalho para as aulas.
const BOTTOM_LINKS = [
  { href: "/", label: "Início", icon: House },
  { href: "/sobre", label: "Sobre", icon: UserRound },
  { href: "/publicacoes", label: "Publicações", icon: Library },
  { href: plataformaUrl(), label: "Aulas", icon: GraduationCap, external: LESSONS_EXTERNAL },
  { href: "/contato", label: "Contato", icon: Mail },
];

/**
 * Diz se o link corresponde à página atual.
 * @param pathname Caminho atual.
 * @param href Destino do link.
 * @returns true se for a seção ativa.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Links do cabeçalho (computador), com o ativo em ciano como no modelo Jacob. */
export function TopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="hidden md:block">
      <ul className="flex items-center gap-8 text-sm font-medium">
        {TOP_LINKS.map(({ href, label, external }) => {
          if (external)
            return (
              <li key={href}>
                <a href={href} className="text-text hover:text-accent">
                  {label}
                </a>
              </li>
            );
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
      <ul className="mx-auto grid max-w-md grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {BOTTOM_LINKS.map(({ href, label, icon: Icon, external }) => {
          if (external)
            return (
              <li key={href}>
                <a
                  href={href}
                  className="text-muted flex flex-col items-center gap-1 py-2.5 text-[11px]"
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </a>
              </li>
            );
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
