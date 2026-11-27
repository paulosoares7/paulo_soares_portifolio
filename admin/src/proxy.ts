import { NextResponse, type NextRequest } from "next/server";

// Telas abertas sem sessão: login e recuperação de senha.
const PUBLIC_PATHS = ["/login", "/esqueci-a-senha", "/redefinir-senha"];

/**
 * Filtro rápido (Next 16 "proxy", antigo middleware): sem cookie de sessão,
 * manda para o login. A validação de verdade (token no banco) acontece no
 * layout do painel e em cada server action.
 * @param request Requisição recebida.
 * @returns Redirecionamento ou passagem.
 */
export function proxy(request: NextRequest): NextResponse {
  const hasSession = request.cookies.has("admin_session");
  const isPublic = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));
  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Rotas de API verificam a sessão por conta própria (respondem 401 em JSON).
  // Arquivos do PWA (manifesto, service worker, página "Sem conexão" e
  // ícones) ficam abertos: o navegador os busca sem sessão.
  matcher: [
    "/((?!_next/|api/|favicon.ico|manifest.webmanifest|sw.js|offline.html|icon|apple-icon|icons/).*)",
  ],
};
