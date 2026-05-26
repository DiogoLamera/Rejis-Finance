import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const EXPIRA_EM_SEGUNDOS = 3600; // 1 hora

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const download = searchParams.get("download") === "1";

    if (!path) {
      return NextResponse.json(
        { error: "Parâmetro 'path' é obrigatório" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from("documentos")
      .createSignedUrl(path, EXPIRA_EM_SEGUNDOS, {
        download,
      });

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Falha ao gerar URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
