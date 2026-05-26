import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatBRL(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export function formatNumero(valor: number, casas = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

export function formatData(data: string | Date, pattern = "dd/MM/yyyy"): string {
  const d = typeof data === "string" ? parseISO(data) : data;
  return format(d, pattern, { locale: ptBR });
}

export function formatDataHora(data: string | Date): string {
  return formatData(data, "dd/MM/yyyy 'às' HH:mm");
}

export function formatMesAno(data: string | Date): string {
  return formatData(data, "MMMM 'de' yyyy");
}
