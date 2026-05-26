import jsPDF from "jspdf";
import { formatBRL, formatData, formatDataHora, formatMesAno } from "@/lib/formatters";
import type { FechamentoDia, FechamentoMes } from "@/lib/mocks/fechamentos";
import type { FechamentoCalculado } from "@/lib/store/transacoes-store";

const NOMES_MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const NOMES_TRIMESTRES = ["1º", "2º", "3º", "4º"];

const VERDE: [number, number, number] = [34, 197, 94];
const VERMELHO: [number, number, number] = [239, 68, 68];

function cabecalho(doc: jsPDF, titulo: string, subtitulo: string): number {
  const largura = doc.internal.pageSize.getWidth();

  // Faixa verde no topo
  doc.setFillColor(...VERDE);
  doc.rect(0, 0, largura, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Rejis's Finance", 14, 9);

  // Título
  let y = 30;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(22);
  doc.text(titulo, 14, y);

  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(subtitulo, 14, y);

  // Divisória
  y += 6;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, largura - 14, y);

  return y + 8;
}

function saldoDestaque(doc: jsPDF, y: number, saldo: number): number {
  const largura = doc.internal.pageSize.getWidth();
  const positivo = saldo >= 0;
  const cor = positivo ? VERDE : VERMELHO;

  doc.setFillColor(...cor);
  doc.rect(14, y, largura - 28, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(
    positivo ? "RESULTADO POSITIVO" : "RESULTADO NEGATIVO",
    18,
    y + 8,
  );

  doc.setFontSize(26);
  doc.text(formatBRL(saldo), 18, y + 22);

  return y + 36;
}

function linhaInfo(
  doc: jsPDF,
  y: number,
  rotulo: string,
  valor: string,
  destaque?: "verde" | "vermelho",
): number {
  const largura = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(rotulo.toUpperCase(), 18, y);

  if (destaque === "verde") doc.setTextColor(...VERDE);
  else if (destaque === "vermelho") doc.setTextColor(...VERMELHO);
  else doc.setTextColor(20, 20, 20);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(valor, largura - 18, y, { align: "right" });

  return y + 9;
}

function tabelaMovimentacao(
  doc: jsPDF,
  y: number,
  entradas: number,
  saidas: number,
  quantidade: number,
): number {
  const largura = doc.internal.pageSize.getWidth();

  // Header da seção
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text("Movimentação", 14, y);

  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, largura - 14, y);
  y += 8;

  doc.setFillColor(248, 250, 252);
  doc.rect(14, y - 5, largura - 28, 33, "F");

  y = linhaInfo(doc, y, "Total de Entradas", formatBRL(entradas), "verde");
  y = linhaInfo(doc, y, "Total de Saídas", formatBRL(saidas), "vermelho");
  y = linhaInfo(doc, y, "Transações registradas", String(quantidade));

  return y + 6;
}

function rodape(doc: jsPDF): void {
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();

  doc.setDrawColor(220, 220, 220);
  doc.line(14, altura - 16, largura - 14, altura - 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Documento gerado em ${formatDataHora(new Date())}`,
    14,
    altura - 10,
  );
  doc.text("Rejis's Finance", largura - 14, altura - 10, { align: "right" });
}

export function baixarRelatorioDiarioPDF(
  data: Date,
  fechamento: FechamentoDia,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = cabecalho(
    doc,
    "Relatório Diário",
    `Fechamento do dia ${formatData(data, "dd 'de' MMMM 'de' yyyy")}`,
  );

  y = saldoDestaque(doc, y, fechamento.saldo);
  y = tabelaMovimentacao(
    doc,
    y,
    fechamento.entradas,
    fechamento.saidas,
    fechamento.quantidade_transacoes,
  );

  rodape(doc);

  const slug = data.toISOString().slice(0, 10);
  doc.save(`relatorio-diario-${slug}.pdf`);
}

export function baixarRelatorioMensalPDF(
  ano: number,
  mes: number,
  fechamento: FechamentoMes,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const dataReferencia = new Date(ano, mes - 1, 1);

  let y = cabecalho(
    doc,
    "Relatório Mensal",
    `Fechamento de ${formatMesAno(dataReferencia)}`,
  );

  y = saldoDestaque(doc, y, fechamento.saldo);
  y = tabelaMovimentacao(
    doc,
    y,
    fechamento.entradas,
    fechamento.saidas,
    fechamento.quantidade_transacoes,
  );

  rodape(doc);

  doc.save(
    `relatorio-mensal-${ano}-${String(mes).padStart(2, "0")}.pdf`,
  );
}

export function baixarRelatorioTrimestralPDF(
  ano: number,
  trimestre: number,
  fechamento: FechamentoCalculado,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const mesInicio = (trimestre - 1) * 3;
  const intervaloMeses = `${NOMES_MESES[mesInicio]} a ${NOMES_MESES[mesInicio + 2]}`;

  let y = cabecalho(
    doc,
    "Relatório Trimestral",
    `${NOMES_TRIMESTRES[trimestre - 1]} trimestre de ${ano} (${intervaloMeses})`,
  );

  y = saldoDestaque(doc, y, fechamento.saldo);
  y = tabelaMovimentacao(
    doc,
    y,
    fechamento.entradas,
    fechamento.saidas,
    fechamento.quantidade_transacoes,
  );

  rodape(doc);

  doc.save(`relatorio-trimestral-${ano}-T${trimestre}.pdf`);
}

export function baixarRelatorioAnualPDF(
  ano: number,
  fechamento: FechamentoCalculado,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = cabecalho(doc, "Relatório Anual", `Fechamento do ano ${ano}`);

  y = saldoDestaque(doc, y, fechamento.saldo);
  y = tabelaMovimentacao(
    doc,
    y,
    fechamento.entradas,
    fechamento.saidas,
    fechamento.quantidade_transacoes,
  );

  rodape(doc);

  doc.save(`relatorio-anual-${ano}.pdf`);
}
