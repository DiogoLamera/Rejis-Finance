import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("contas_a_pagar")
      .select("*")
      .order("data_vencimento", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contas: data });
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
    if (
      !body.data_vencimento ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.data_vencimento)
    ) {
      return NextResponse.json(
        { error: "Data de vencimento inválida (formato YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    // Define status automaticamente: vencida -> atrasada, futura -> pendente
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const venc = new Date(body.data_vencimento + "T00:00:00");
    const status = body.status ?? (venc < hoje ? "atrasada" : "pendente");

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("contas_a_pagar")
      .insert([
        {
          descricao: body.descricao,
          valor: body.valor,
          data_vencimento: body.data_vencimento,
          categoria: body.categoria ?? "outros",
          status,
          recorrente: body.recorrente ?? false,
          documento_url: body.documento_url ?? null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conta: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
