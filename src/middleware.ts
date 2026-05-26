import { NextRequest, NextResponse } from "next/server";
import { COOKIE_AUTH, verificarToken } from "@/lib/auth";

const ROTAS_PUBLICAS = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const ehRotaPublica = ROTAS_PUBLICAS.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );

  const token = request.cookies.get(COOKIE_AUTH)?.value;
  const payload = token ? await verificarToken(token) : null;
  const autenticado = !!payload;

  // Já logado tentando acessar /login → manda pra home
  if (autenticado && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Não autenticado e rota privada → manda pro /login
  if (!autenticado && !ehRotaPublica) {
    // APIs respondem 401 em vez de redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica em todas as rotas exceto:
     * - _next/static (arquivos estáticos do Next)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - arquivos comuns (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
