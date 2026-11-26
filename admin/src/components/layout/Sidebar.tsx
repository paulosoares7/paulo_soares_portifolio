"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useSyncExternalStore } from "react";
import {
  AtSign,
  BarChart3,
  BookOpen,
  Briefcase,
  ChevronDown,
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

const summary: Item[] = [
  { href: "/", label: "Resumo", icon: LayoutDashboard },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

// O painel cuida de dois projetos: o portfólio e a plataforma de aulas.
const groups: { key: string; title: string; items: Item[] }[] = [
  {
    key: "portfolio",
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
    key: "plataforma",
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

// Seções recolhidas ficam guardadas no navegador (só conveniência visual).
const STORAGE_KEY = "admin-sidebar-collapsed";

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

const CHANGE_EVENT = "admin-sidebar-change";

/** Avisa o componente quando o storage ou a largura da tela mudam. */
function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia("(min-width: 1024px)");
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

/** Texto salvo das seções recolhidas (sem storage = nada recolhido). */
function readSaved(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "{}";
  } catch {
    return "{}";
  }
}

/** Converte o texto salvo em { portfolio: true, ... }. */
function parseCollapsed(raw: string): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(raw);
    return value && typeof value === "object" ? (value as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

/**
 * Menu do painel. No computador: coluna com rolagem própria e as seções
 * "Portfólio" e "Plataforma de aulas" recolhíveis (estado lembrado). No
 * celular: barra rolável na horizontal, sempre aberta.
 */
export function Sidebar() {
  const pathname = usePathname();
  // No servidor tudo começa aberto; no navegador vale o que foi salvo.
  const saved = useSyncExternalStore(subscribe, readSaved, () => "{}");
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  );
  const collapsed = useMemo(() => parseCollapsed(saved), [saved]);

  function toggle(key: string): void {
    const next = { ...collapsed, [key]: !collapsed[key] };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Sem storage (aba privada): só não lembra a escolha.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return (
    <nav aria-label="Seções do painel">
      <ul className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
        <li className="flex shrink-0 gap-1 lg:block">
          <ul className="flex gap-1 lg:flex-col">
            {summary.map((item) => (
              <NavItem key={item.href} item={item} pathname={pathname} />
            ))}
          </ul>
        </li>
        {groups.map((group) => {
          const closed = desktop && Boolean(collapsed[group.key]);
          const listId = `menu-${group.key}`;
          return (
            <li key={group.key} className="flex shrink-0 items-center gap-1 lg:block">
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={!closed}
                aria-controls={listId}
                className="text-muted hover:text-text rounded-btn hidden w-full items-center justify-between px-3 pb-1 text-xs font-semibold tracking-wide uppercase transition-colors lg:flex"
              >
                {group.title}
                <ChevronDown
                  className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${closed ? "-rotate-90" : ""}`}
                  aria-hidden
                />
              </button>
              {/* grid-rows 1fr → 0fr anima a altura sem medir o conteúdo. */}
              <div
                className={`motion-reduce:transition-none lg:grid lg:transition-[grid-template-rows] lg:duration-200 lg:ease-out ${
                  closed ? "lg:grid-rows-[0fr]" : "lg:grid-rows-[1fr]"
                }`}
              >
                <ul
                  id={listId}
                  aria-label={group.title}
                  inert={closed}
                  // invisible no fim da animação: a lista some de vez (não só fica sem altura).
                  className={`border-border flex gap-1 border-l pl-1 lg:min-h-0 lg:flex-col lg:overflow-hidden lg:border-l-0 lg:pl-0 lg:transition-[visibility] lg:duration-200 ${
                    closed ? "lg:invisible" : ""
                  }`}
                >
                  {group.items.map((item) => (
                    <NavItem key={item.href} item={item} pathname={pathname} />
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
