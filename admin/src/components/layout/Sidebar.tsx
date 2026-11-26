"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AtSign,
  BookOpen,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  FolderTree,
  LayoutDashboard,
  Library,
  Mail,
  MessagesSquare,
  UserRound,
  Users,
  Video,
} from "lucide-react";

type Item = { href: string; label: string; icon: typeof LayoutDashboard };

const summary: Item = { href: "/", label: "Resumo", icon: LayoutDashboard };

// O painel cuida de dois projetos: o portfólio e a plataforma de aulas.
const groups: { title: string; items: Item[] }[] = [
  {
    title: "Portfólio",
    items: [
      { href: "/perfil", label: "Perfil", icon: UserRound },
      { href: "/formacao-e-atuacao", label: "Formação e atuação", icon: Briefcase },
      { href: "/areas-de-pesquisa", label: "Áreas de pesquisa", icon: FlaskConical },
      { href: "/publicacoes", label: "Publicações", icon: Library },
      { href: "/redes-sociais", label: "Redes sociais", icon: AtSign },
      { href: "/mensagens", label: "Mensagens de contato", icon: Mail },
    ],
  },
  {
    title: "Plataforma de aulas",
    items: [
      { href: "/categorias", label: "Categorias e grupos", icon: FolderTree },
      { href: "/disciplinas", label: "Disciplinas", icon: BookOpen },
      { href: "/videos", label: "Vídeos", icon: Video },
      { href: "/materiais", label: "Materiais", icon: FileText },
      { href: "/atividades", label: "Atividades", icon: ClipboardList },
      { href: "/alunos", label: "Alunos", icon: Users },
      { href: "/assinaturas", label: "Assinaturas", icon: CreditCard },
      { href: "/forum", label: "Fórum", icon: MessagesSquare },
    ],
  },
];

/**
 * Diz se o item do menu corresponde à página atual.
 * @param pathname Caminho atual.
 * @param href Caminho do item.
 * @returns true se for a seção ativa.
 */
function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Um link do menu, destacado quando é a página atual. */
function NavItem({ item, pathname }: { item: Item; pathname: string }) {
  const { href, label, icon: Icon } = item;
  const active = isActive(pathname, href);
  return (
    <li className="shrink-0">
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`rounded-btn flex items-center gap-3 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
          active
            ? "bg-accent/15 text-accent font-medium"
            : "text-muted hover:bg-surface-2 hover:text-text"
        }`}
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </Link>
    </li>
  );
}

/**
 * Menu lateral (computador) e barra rolável no topo (celular): resumo e as
 * seções "Portfólio" e "Plataforma de aulas".
 */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções do painel">
      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
        <NavItem item={summary} pathname={pathname} />
        {groups.map((group) => (
          <li key={group.title} className="flex shrink-0 items-center gap-1 lg:block">
            <p
              id={`menu-${group.title}`}
              className="text-muted border-border hidden px-3 pb-1 text-xs font-semibold tracking-wide uppercase lg:block"
            >
              {group.title}
            </p>
            <ul
              aria-labelledby={`menu-${group.title}`}
              className="border-border flex gap-1 border-l pl-1 lg:flex-col lg:border-l-0 lg:pl-0"
            >
              {group.items.map((item) => (
                <NavItem key={item.href} item={item} pathname={pathname} />
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}
