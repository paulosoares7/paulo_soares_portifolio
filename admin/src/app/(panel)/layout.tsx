import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { requireAdmin } from "@/lib/auth";

// Painel sempre lê dados atuais do banco.
export const dynamic = "force-dynamic";

/**
 * Layout do painel: exige sessão válida de admin (CLAUDE.md do admin). No
 * computador, o menu lateral tem altura da tela com a marca no topo e o
 * usuário no rodapé fixos; só a lista do meio rola.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row lg:gap-8 lg:px-6">
      <aside className="border-border border-b lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:border-b-0">
        <div className="lg:hidden">
          <Topbar name={admin.name} email={admin.email} />
        </div>
        <p className="hidden shrink-0 px-3 pt-6 pb-5 text-xl font-semibold lg:block">
          Painel<span className="text-accent">.</span>
        </p>
        <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1 lg:pb-4">
          <Sidebar />
        </div>
        <div className="border-border hidden shrink-0 items-center justify-between gap-2 border-t px-3 py-4 lg:flex">
          <div className="min-w-0">
            <p className="text-text truncate text-sm font-medium">{admin.name}</p>
            <p className="text-muted truncate text-xs" title={admin.email}>
              {admin.email}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Sair"
              aria-label="Sair"
              className="rounded-btn text-muted hover:bg-surface hover:text-text inline-flex size-9 items-center justify-center"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1 lg:py-4">
        <main className="px-4 py-6 lg:px-0">{children}</main>
      </div>
    </div>
  );
}
