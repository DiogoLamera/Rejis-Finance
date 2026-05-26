import jsPDF from "jspdf";
import { formatBRL, formatData, formatDataHora } from "@/lib/formatters";

export interface ContaParaPDF {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: Date | string;
  data_pagamento?: Date | string | null;
  categoria: string;
  status: "pendente" | "paga" | "atrasada";
  observacoes?: string | null;
  documentoPath?: string | null;
}

const STATUS_LABEL: Record<ContaParaPDF["status"], string> = {
  pendente: "Pendente",
  paga: "Paga",
  atrasada: "Atrasada",
};

function gerarDocumento(conta: ContaParaPDF): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const larguraPagina = doc.internal.pageSize.getWidth();
  let y = 20;

  // Cabeçalho
  doc.setFillColor(34, 197, 94); // verde primary
  doc.rect(0, 0, larguraPagina, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Rejis's Finance", 14, 8);

  // Título
  y = 30;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(20);
  doc.text("Detalhes da Conta a Pagar", 14, y);

  // ID/referência da conta
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Ref: #${conta.id}`, 14, y);

  // Linha divisória
  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, larguraPagina - 14, y);

  // Dados principais
  y += 12;
  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Descrição", 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(conta.descricao, 14, y + 6);

  // Valor (destaque)
  y += 18;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y - 5, larguraPagina - 28, 18, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("VALOR", 18, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(formatBRL(conta.valor), 18, y + 8);

  // Grid de informações
  y += 22;
  const linhas: Array<[string, string]> = [
    [
      "Vencimento",
      formatData(
        typeof conta.data_vencimento === "string"
          ? conta.data_vencimento
          : conta.data_vencimento.toISOString().slice(0, 10),
      ),
    ],
    ["Categoria", conta.categoria.charAt(0).toUpperCase() + conta.categoria.slice(1)],
    ["Status", STATUS_LABEL[conta.status]],
  ];

  if (conta.data_pagamento) {
    linhas.push([
      "Pagamento",
      formatData(
        typeof conta.data_pagamento === "string"
          ? conta.data_pagamento
          : conta.data_pagamento.toISOString().slice(0, 10),
      ),
    ]);
  }

  doc.setFontSize(10);
  linhas.forEach(([rotulo, valor]) => {
    y += 9;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 120, 120);
    doc.text(rotulo.toUpperCase(), 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(20, 20, 20);
    doc.text(valor, 60, y);
  });

  // Observações
  if (conta.observacoes) {
    y += 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("OBSERVAÇÕES", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    const linhasObs = doc.splitTextToSize(
      conta.observacoes,
      larguraPagina - 28,
    );
    doc.text(linhasObs, 14, y);
  }

  // Rodapé
  const alturaPagina = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Documento gerado em ${formatDataHora(new Date())}`,
    14,
    alturaPagina - 10,
  );
  doc.text("Rejis's Finance", larguraPagina - 14, alturaPagina - 10, {
    align: "right",
  });

  return doc;
}

export function baixarContaPDF(conta: ContaParaPDF): void {
  const doc = gerarDocumento(conta);
  const slug = conta.descricao
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  doc.save(`conta-${slug}-${conta.id}.pdf`);
}

export function imprimirContaPDF(conta: ContaParaPDF): void {
  const doc = gerarDocumento(conta);
  doc.autoPrint();
  const blobUrl = doc.output("bloburl");
  window.open(blobUrl.toString(), "_blank");
}
