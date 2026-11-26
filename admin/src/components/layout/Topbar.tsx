import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";

/** Barra superior com o nome do admin e o botão de sair. */
export function Topbar({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-0">
      {/* No computador a marca já aparece no menu lateral. */}
      <p className="text-lg font-semibold lg:invisible">
        Painel<span className="text-accent">.</span>
      </p>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-text text-sm font-medium">{name}</p>
          <p className="text-muted text-xs">{email}</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-btn text-muted hover:bg-surface hover:text-text inline-flex items-center gap-2 px-3 py-2 text-sm"
          >
            <LogOut className="size-4" aria-hidden />
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
