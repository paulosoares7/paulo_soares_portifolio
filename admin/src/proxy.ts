import { NextResponse, type NextRequest } from "next/server";

/**
 * Filtro rápido (Next 16 "proxy", antigo middleware): sem cookie de sessão,
 * manda para o login. A validação de verdade (token no banco) acontece no
 * layout do painel e em cada server action.
 * @param request Requisição recebida.
 * @returns Redirecionamento ou passagem.
 */
export function proxy(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has("admin_session");
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  if (!hasSession && !isLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Rotas de API verificam a sessão por conta própria (respondem 401 em JSON).
  matcher: ["/((?!_next/|api/|favicon.ico).*)"],
};
