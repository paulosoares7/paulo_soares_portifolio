"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, LayoutDashboard, PlayCircle } from "lucide-react";
import { ButtonLink } from "@portfolio/ui/Button";
import { Container } from "@portfolio/ui/Container";
import { authClient } from "@/lib/auth-client";
import type { ContinueLesson } from "@/types/continue-lesson";

/**
 * Abertura da página inicial: para o visitante, a apresentação (children);
 * para o aluno logado, "Olá, Nome" com o continuar de onde parou e o atalho
 * para o painel. A sessão é lida no navegador para a página continuar
 * estática (SEO e velocidade).
 */
export function WelcomeBack({ children }: { children: ReactNode }) {
  const { data } = authClient.useSession();
  const [lesson, setLesson] = useState<ContinueLesson | null>(null);
  const loggedIn = Boolean(data);

  useEffect(() => {
    if (!loggedIn) return;
    let active = true;
    fetch("/api/continue-lesson", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { lesson: ContinueLesson | null } | null) => {
        if (active && body) setLesson(body.lesson);
      })
      .catch(() => {
        // Sem a aula, a saudação mostra só o atalho para o painel.
      });
    return () => {
      active = false;
    };
  }, [loggedIn]);

  if (!data) return <>{children}</>;
  const firstName = data.user.name.trim().split(/\s+/)[0] || "aluno";

  return (
    <Container className="relative py-16 md:py-20">
      <p className="text-accent text-sm font-semibold tracking-wide uppercase">
        Bom te ver de novo
      </p>
      <h1 className="mt-3 text-4xl leading-tight font-bold sm:text-5xl">Olá, {firstName}!</h1>
      {lesson ? (
        <Link
          href={lesson.href}
          className="group rounded-card border-accent/40 bg-accent/5 hover:border-accent mt-8 flex max-w-xl items-center gap-4 border p-4 transition-colors"
        >
          <PlayCircle className="text-accent size-10 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="text-muted block text-xs">Continuar de onde parou</span>
            <span className="block truncate font-semibold">{lesson.title}</span>
            <span className="text-muted block truncate text-sm">{lesson.course}</span>
          </span>
          <ArrowRight
            className="text-accent size-5 shrink-0 transition-transform group-hover:translate-x-1"
            aria-hidden
          />
        </Link>
      ) : (
        <p className="text-muted mt-5 max-w-2xl text-lg leading-relaxed">
          Seu painel mostra o seu progresso, as últimas aulas e as atividades.
        </p>
      )}
      <div className="mt-8 flex flex-wrap gap-4">
        <ButtonLink href="/minha-area">
          <LayoutDashboard className="size-4" aria-hidden /> Ir para o meu painel
        </ButtonLink>
        <ButtonLink href="/aulas" variant="outline">
          Ver as aulas
        </ButtonLink>
      </div>
    </Container>
  );
}
