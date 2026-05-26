import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const TAMANHO_MAX = 10 * 1024 * 1024; // 10 MB

function sanitizarNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo");
    const escopo = (formData.get("escopo") as string) || "transacao"; // "transacao" | "conta"

    if (!(arquivo instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 },
      );
    }
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
      return NextResponse.json(
        { error: `Tipo não suportado: ${arquivo.type}` },
        { status: 400 },
      );
    }
    if (arquivo.size > TAMANHO_MAX) {
      return NextResponse.json(
        { error: "Arquivo excede 10 MB" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();
    const path = `${escopo}/${crypto.randomUUID()}-${sanitizarNome(arquivo.name)}`;
    const bytes = await arquivo.arrayBuffer();

    const { error } = await supabase.storage
      .from("documentos")
      .upload(path, bytes, {
        contentType: arquivo.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      path,
      nome: arquivo.name,
      tipo: arquivo.type,
      tamanho: arquivo.size,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro inesperado" },
      { status: 500 },
    );
  }
}
