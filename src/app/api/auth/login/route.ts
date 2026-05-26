import { NextResponse } from "next/server";
import { COOKIE_AUTH, credenciaisValidas, gerarToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { user, senha } = await request.json();

    if (typeof user !== "string" || typeof senha !== "string") {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 },
      );
    }

    if (!credenciaisValidas(user, senha)) {
      // Pequeno atraso pra mitigar timing attacks/brute-force
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json(
        { error: "Usuário ou senha incorretos" },
        { status: 401 },
      );
    }

    const token = await gerarToken(user);

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: COOKIE_AUTH,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return response;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro inesperado" },
      { status: 500 },
    );
  }
}
