"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BookOpen, CreditCard, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { loginReturnPath } from "@/lib/safe-next";

const ITEMS = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/#disciplinas", label: "Minhas disciplinas", icon: BookOpen },
  { href: "/#assinatura", label: "Assinatura", icon: CreditCard },
];

/**
 * Iniciais do nome para o avatar sem foto ("Paulo Soares" → "PS").
 * @param name Nome do aluno.
 * @returns Uma ou duas letras.
 */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts.at(-1)] : parts;
  return letters.map((p) => p?.[0]?.toUpperCase() ?? "").join("") || "?";
}

/**
 * Avatar do aluno no cabeçalho com menu (Painel, Minhas disciplinas,
 * Assinatura, Sair). Fecha ao clicar/tocar fora, com Esc e ao navegar.
 * Sem login, mostra "Entrar". A sessão é lida no navegador para as páginas
 * públicas continuarem estáticas (SEO e velocidade).
 */
export function UserMenu() {
  const { data, isPending } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  const router = useRouter();

  // Fecha ao trocar de página.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    // pointerdown cobre mouse e toque.
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (isPending) {
    return <span aria-hidden className="bg-surface-2 size-9 animate-pulse rounded-full" />;
  }

  if (!data) {
    // Da aula ou atividade, volta para ela; do resto, vai para o painel (o Início).
    const back = loginReturnPath(pathname);
    const next = back ? `?next=${encodeURIComponent(back)}` : "";
    return (
      <Link
        href={`/entrar${next}`}
        className="border-accent/60 text-accent hover:bg-accent hover:text-bg rounded-btn inline-flex h-9 items-center gap-2 border px-3 text-sm font-medium transition-colors"
      >
        <LogIn className="size-4" aria-hidden /> Entrar
      </Link>
    );
  }

  const { name, email, image } = data.user;

  async function signOut(): Promise<void> {
    setLeaving(true);
    await authClient.signOut();
    setOpen(false);
    setLeaving(false);
    router.replace("/");
    router.refresh();
  }

  return (
    <div ref={box} className="relative">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Menu da conta de ${name}`}
        className="border-accent/60 bg-accent/15 text-accent hover:border-accent focus-visible:outline-accent flex size-9 items-center justify-center overflow-hidden rounded-full border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        {image ? (
          // Foto do Google: domínio externo, sem otimização do Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initials(name)
        )}
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label="Conta"
        hidden={!open}
        className="rounded-card border-border bg-surface absolute right-0 z-50 mt-2 w-64 animate-[menu-in_150ms_ease-out] border p-2 shadow-xl motion-reduce:animate-none"
      >
        <div className="border-border mb-2 border-b px-3 pt-1 pb-3">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-muted truncate text-xs">{email}</p>
        </div>
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="rounded-btn text-text hover:bg-surface-2 hover:text-accent flex items-center gap-3 px-3 py-2.5 text-sm transition-colors"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        ))}
        <button
          type="button"
          role="menuitem"
          onClick={signOut}
          disabled={leaving}
          className="rounded-btn text-muted hover:bg-surface-2 hover:text-text mt-1 flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors disabled:opacity-60"
        >
          <LogOut className="size-4" aria-hidden />
          {leaving ? "Saindo..." : "Sair"}
        </button>
      </div>
    </div>
  );
}
