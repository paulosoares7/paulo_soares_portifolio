"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  CreditCard,
  FileText,
  FolderTree,
  LayoutDashboard,
  Library,
  Mail,
  MessagesSquare,
  UserRound,
  Users,
  Video,
} from "lucide-react";

const items = [
  { href: "/", label: "Resumo", icon: LayoutDashboard },
  { href: "/perfil", label: "Perfil", icon: UserRound },
  { href: "/publicacoes", label: "Publicações", icon: Library },
  { href: "/categorias", label: "Categorias", icon: FolderTree },
  { href: "/disciplinas", label: "Disciplinas", icon: BookOpen },
  { href: "/videos", label: "Vídeos", icon: Video },
  { href: "/materiais", label: "Materiais", icon: FileText },
  { href: "/atividades", label: "Atividades", icon: ClipboardList },
  { href: "/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/forum", label: "Fórum", icon: MessagesSquare },
  { href: "/mensagens", label: "Mensagens", icon: Mail },
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

/** Menu lateral (computador) e barra rolável no topo (celular). */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Seções do painel">
      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-btn flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
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
        })}
      </ul>
    </nav>
  );
}
