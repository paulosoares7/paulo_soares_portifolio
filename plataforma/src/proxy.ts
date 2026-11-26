import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Rotas só de aluno logado. Aulas e atividades pagas são checadas na própria
// página (lib/access.ts), porque as grátis ficam abertas.
const STUDENT_ONLY = ["/minha-area", "/forum"];

/**
 * Filtro rápido (Next 16 "proxy", antigo middleware): sem cookie de sessão,
 * manda para /entrar e guarda a página para voltar depois. A validação de
 * verdade (sessão no banco) acontece na página, com lib/access.ts.
 * @param request Requisição recebida.
 * @returns Redirecionamento ou passagem.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const isStudentOnly = STUDENT_ONLY.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isStudentOnly && !getSessionCookie(request)) {
    const url = new URL("/entrar", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/minha-area/:path*", "/forum/:path*"],
};
