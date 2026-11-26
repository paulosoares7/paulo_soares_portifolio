"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

/** Logo do Google (cores oficiais), só decorativo. */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.6 17.7 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.5 5.8c4.4-4 6.8-10 6.8-17.3z"
      />
      <path
        fill="#FBBC05"
        d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

/**
 * Botão "Entrar com Google". Se o e-mail já tem conta, o Better Auth vincula
 * o Google à mesma conta (lib/auth.ts).
 * @param next Página para voltar depois do login.
 */
export function GoogleButton({ next }: { next: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        const { error } = await authClient.signIn.social({
          provider: "google",
          callbackURL: next,
          errorCallbackURL: "/entrar?erro=google",
        });
        // Sem erro, o navegador já está indo para o Google.
        if (error) {
          setPending(false);
          router.push("/entrar?erro=google");
        }
      }}
      className="rounded-btn border-border bg-text text-bg hover:bg-text/90 inline-flex h-11 w-full items-center justify-center gap-3 border text-sm font-semibold transition-colors disabled:opacity-60"
    >
      <GoogleLogo /> {pending ? "Abrindo o Google..." : "Continuar com Google"}
    </button>
  );
}

/**
 * Google em destaque no topo do login e do cadastro. Sem as chaves do Google
 * (GOOGLE_CLIENT_ID/SECRET), some em produção; em desenvolvimento aparece
 * desativado com o aviso do que falta (guia em docs/guia-login-google.md).
 * @param next Página para voltar depois do login.
 * @param enabled Google configurado no servidor.
 * @param showSetupHint Mostrar o aviso de configuração (só em desenvolvimento).
 */
export function GoogleSection({
  next,
  enabled,
  showSetupHint,
}: {
  next: string;
  enabled: boolean;
  showSetupHint: boolean;
}) {
  if (!enabled && !showSetupHint) return null;
  return (
    <>
      {enabled ? (
        <GoogleButton next={next} />
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled
            className="rounded-btn border-border bg-text text-bg inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 border text-sm font-semibold opacity-50"
          >
            <GoogleLogo /> Continuar com Google
          </button>
          <p className="text-warning text-xs">
            Google ainda não configurado: preencha GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no
            .env.local (passo a passo em docs/guia-login-google.md). Aviso só no desenvolvimento.
          </p>
        </div>
      )}
      <OrDivider />
    </>
  );
}

/** "Entrar como visitante": vai ao catálogo sem conta (aulas grátis abertas). */
export function VisitorLink() {
  return (
    <Link
      href="/aulas"
      className="rounded-btn text-muted hover:text-text hover:bg-surface-2 inline-flex h-11 w-full items-center justify-center gap-2 text-sm font-medium transition-colors"
    >
      <Compass className="size-4" aria-hidden /> Entrar como visitante
    </Link>
  );
}

/** Linha "ou" entre o Google e o formulário. */
export function OrDivider() {
  return (
    <div className="text-muted flex items-center gap-3 text-xs" aria-hidden>
      <span className="bg-border h-px flex-1" /> ou <span className="bg-border h-px flex-1" />
    </div>
  );
}
