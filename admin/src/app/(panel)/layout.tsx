import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { requireAdmin } from "@/lib/auth";

// Painel sempre lê dados atuais do banco.
export const dynamic = "force-dynamic";

/** Layout do painel: exige sessão válida de admin (CLAUDE.md do admin). */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col lg:flex-row lg:gap-8 lg:px-6">
      <aside className="border-border border-b lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:shrink-0 lg:border-b-0 lg:py-6">
        <div className="lg:hidden">
          <Topbar name={admin.name} email={admin.email} />
        </div>
        <p className="hidden px-3 pb-6 text-xl font-semibold lg:block">
          Painel<span className="text-accent">.</span>
        </p>
        <Sidebar />
      </aside>
      <div className="min-w-0 flex-1 lg:py-4">
        <div className="border-border hidden border-b pb-2 lg:block">
          <Topbar name={admin.name} email={admin.email} />
        </div>
        <main className="px-4 py-6 lg:px-0">{children}</main>
      </div>
    </div>
  );
}
