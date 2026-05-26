import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SISTEMA = `Você é um assistente de educação financeira que sugere investimentos para empresas brasileiras.

Receba um VALOR (em reais) e o PRAZO desejado, e devolva APENAS um JSON array válido
com 4 a 6 sugestões de investimento, sem markdown, sem texto antes ou depois.

Cada sugestão segue este formato exatamente:

{
  "nome": "Nome específico do investimento (ex: 'Tesouro Selic 2029', 'CDB 110% CDI', 'LCI Banco XYZ')",
  "tipo": "Categoria curta (ex: 'Renda fixa pública', 'Renda fixa privada', 'Fundo', 'Tesouro Direto')",
  "rentabilidade_estimada": "Como rende (ex: '100% do CDI', 'IPCA + 6%', '~12% ao ano')",
  "liquidez": "Quando pode resgatar (ex: 'D+0 diária', 'No vencimento', 'D+30')",
  "risco": "Muito baixo" | "Baixo" | "Médio" | "Alto",
  "imposto": "Regime tributário resumido (ex: 'IR regressivo 22,5% a 15%', 'Isento de IR', 'come-cotas semestral')",
  "aplicacao_minima": "Valor mínimo aproximado em texto (ex: 'R$ 30', 'R$ 1.000', 'R$ 100')",
  "explicacao": "2 a 3 frases explicando o que é o investimento de forma didática, sem jargão demais.",
  "justificativa": "1 a 2 frases explicando especificamente POR QUE essa opção faz sentido pro VALOR e PRAZO informados pelo usuário."
}

Critérios por prazo:
- "curto" (até 1 ano): priorize alta liquidez (D+0/D+1), risco muito baixo a baixo, sem perda no resgate antecipado.
- "medio" (1 a 3 anos): equilibre rentabilidade e segurança. Aceita liquidez no vencimento se compensar.
- "longo" (mais de 3 anos): foque em rentabilidade real (ganho acima da inflação). Pode incluir mais risco controlado (multimercado, ações via ETF, FIIs).

Contexto: cenário econômico brasileiro atual (Selic, CDI, IPCA, opções comuns no mercado). Use valores aproximados realistas.
Se o valor for menor que a aplicação mínima de algum produto, NÃO sugira esse produto.

IMPORTANTE: devolva APENAS o JSON array, começando com [ e terminando com ]. Sem markdown, sem comentário.`;

export interface SugestaoInvestimento {
  nome: string;
  tipo: string;
  rentabilidade_estimada: string;
  liquidez: string;
  risco: "Muito baixo" | "Baixo" | "Médio" | "Alto";
  imposto: string;
  aplicacao_minima: string;
  explicacao: string;
  justificativa: string;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "Chave da Claude API não configurada. Adicione ANTHROPIC_API_KEY no .env.local.",
      },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const { valor, prazo } = body;

    if (typeof valor !== "number" || valor <= 0) {
      return NextResponse.json(
        { error: "Valor inválido (deve ser número positivo)" },
        { status: 400 },
      );
    }
    if (!["curto", "medio", "longo"].includes(prazo)) {
      return NextResponse.json(
        { error: "Prazo inválido (use 'curto', 'medio' ou 'longo')" },
        { status: 400 },
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const prazoLabel =
      prazo === "curto"
        ? "curto prazo (até 1 ano)"
        : prazo === "medio"
          ? "médio prazo (1 a 3 anos)"
          : "longo prazo (mais de 3 anos)";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3072,
      system: SISTEMA,
      messages: [
        {
          role: "user",
          content: `VALOR: R$ ${valor.toFixed(2)}\nPRAZO: ${prazoLabel}\n\nGere as sugestões em JSON.`,
        },
      ],
    });

    const textBlock = message.content.find((c) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Resposta inesperada da Claude API" },
        { status: 502 },
      );
    }

    const jsonMatch = textBlock.text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Não foi possível extrair as sugestões da resposta" },
        { status: 502 },
      );
    }

    const sugestoes: SugestaoInvestimento[] = JSON.parse(jsonMatch[0]);

    return NextResponse.json({ sugestoes, valor, prazo });
  } catch (erro) {
    console.error("[/api/investimentos]", erro);
    return NextResponse.json(
      {
        error:
          erro instanceof Error
            ? erro.message
            : "Falha inesperada ao gerar sugestões",
      },
      { status: 500 },
    );
  }
}
