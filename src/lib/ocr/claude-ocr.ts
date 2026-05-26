import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface DadosExtraidos {
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  fornecedor_ou_cliente: string | null;
  observacoes: string | null;
}

const PROMPT_OCR = `Você é um assistente que extrai dados de notas fiscais, recibos e comprovantes de pagamento brasileiros.

Analise a imagem/documento anexado e retorne APENAS um JSON válido (sem markdown, sem explicação) com a seguinte estrutura:

{
  "tipo": "entrada" ou "saida",
  "descricao": "descrição curta do que é o documento",
  "valor": número decimal (sem R$, sem separador de milhar, use ponto como decimal),
  "data": "YYYY-MM-DD",
  "categoria": "uma das categorias abaixo",
  "fornecedor_ou_cliente": "nome da empresa/pessoa ou null",
  "observacoes": "informações relevantes ou null"
}

Categorias para SAÍDA: ferramentas, materiais, salarios, impostos, aluguel, energia, agua, internet, transporte, manutencao, outros
Categorias para ENTRADA: servico_prestado, venda_produto, rendimento, outros

Se for uma nota fiscal/recibo de serviço prestado PELA empresa, é "entrada".
Se for comprovante de pagamento feito PELA empresa, é "saida".`;

export async function extrairDadosDocumento(
  arquivoBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
): Promise<DadosExtraidos> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: mediaType === "application/pdf" ? "document" : "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: arquivoBase64,
            },
          } as never,
          {
            type: "text",
            text: PROMPT_OCR,
          },
        ],
      },
    ],
  });

  const textBlock = message.content.find((c) => c.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Resposta da Claude API sem texto");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Não foi possível extrair JSON da resposta");
  }

  return JSON.parse(jsonMatch[0]) as DadosExtraidos;
}
