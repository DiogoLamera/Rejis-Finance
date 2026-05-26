import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("transacoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transacoes: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.tipo || !["entrada", "saida"].includes(body.tipo)) {
      return NextResponse.json(
        { error: "Tipo inválido (deve ser 'entrada' ou 'saida')" },
        { status: 400 },
      );
    }
    if (!body.descricao || typeof body.descricao !== "string") {
      return NextResponse.json(
        { error: "Descrição obrigatória" },
        { status: 400 },
      );
    }
    if (typeof body.valor !== "number" || body.valor <= 0) {
      return NextResponse.json(
        { error: "Valor deve ser número maior que zero" },
        { status: 400 },
      );
    }
    if (!body.data || !/^\d{4}-\d{2}-\d{2}$/.test(body.data)) {
      return NextResponse.json(
        { error: "Data inválida (formato YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("transacoes")
      .insert([
        {
          tipo: body.tipo,
          descricao: body.descricao,
          valor: body.valor,
          data: body.data,
          categoria: body.categoria ?? "outros",
          documento_url: body.documento_url ?? null,
          status: "confirmada",
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transacao: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
