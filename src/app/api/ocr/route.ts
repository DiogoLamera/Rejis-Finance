import { NextResponse } from "next/server";
import { extrairDadosDocumento } from "@/lib/ocr/claude-ocr";

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

type TipoPermitido = (typeof TIPOS_PERMITIDOS)[number];

export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Chave da Claude API não configurada. Adicione ANTHROPIC_API_KEY no arquivo .env.local para usar o preenchimento automático.",
      },
      { status: 503 },
    );
  }

  try {
    const formData = await request.formData();
    const arquivo = formData.get("arquivo");

    if (!(arquivo instanceof File)) {
      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 },
      );
    }

    if (!TIPOS_PERMITIDOS.includes(arquivo.type as TipoPermitido)) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo não suportado (${arquivo.type}). Use PDF ou imagem (JPEG, PNG, WEBP).`,
        },
        { status: 400 },
      );
    }

    const bytes = await arquivo.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const dados = await extrairDadosDocumento(
      base64,
      arquivo.type as TipoPermitido,
    );

    return NextResponse.json(dados);
  } catch (erro) {
    console.error("[/api/ocr] Erro na extração:", erro);
    return NextResponse.json(
      {
        error:
          erro instanceof Error
            ? erro.message
            : "Falha inesperada ao processar o documento",
      },
      { status: 500 },
    );
  }
}
