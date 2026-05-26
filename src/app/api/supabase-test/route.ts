import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Resultado {
  ok: boolean;
  mensagem: string;
  detalhes?: Record<string, unknown>;
}

export async function GET(): Promise<NextResponse<Resultado>> {
  // 1. Verifica se as variáveis de ambiente estão configuradas
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || url.includes("COLE_AQUI")) {
    return NextResponse.json(
      { ok: false, mensagem: "NEXT_PUBLIC_SUPABASE_URL não configurada" },
      { status: 503 },
    );
  }
  if (!anonKey || anonKey.includes("COLE_AQUI")) {
    return NextResponse.json(
      { ok: false, mensagem: "NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada" },
      { status: 503 },
    );
  }

  // 2. Tenta conectar e ler a contagem de cada tabela
  try {
    const supabase = await createClient();

    const tabelas = [
      "transacoes",
      "contas_a_pagar",
      "fechamentos_diarios",
      "fechamentos_mensais",
    ];

    const resultados: Record<string, string> = {};

    for (const tabela of tabelas) {
      const { error } = await supabase
        .from(tabela)
        .select("id", { count: "exact", head: true });

      if (error) {
        resultados[tabela] = `❌ ${error.message}`;
      } else {
        resultados[tabela] = "✅ acessível";
      }
    }

    const todasOk = Object.values(resultados).every((r) => r.startsWith("✅"));

    return NextResponse.json({
      ok: todasOk,
      mensagem: todasOk
        ? "Conexão com Supabase OK — todas as tabelas estão acessíveis"
        : "Conectou no Supabase, mas algumas tabelas têm problemas",
      detalhes: {
        url,
        anon_key_configurada: !!anonKey,
        service_role_configurada: !!serviceKey && !serviceKey.includes("COLE_AQUI"),
        tabelas: resultados,
      },
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: "Falha ao conectar com o Supabase",
        detalhes: {
          erro: e instanceof Error ? e.message : String(e),
          url,
        },
      },
      { status: 500 },
    );
  }
}
