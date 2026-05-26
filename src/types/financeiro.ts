export type TipoTransacao = "entrada" | "saida";

export type StatusTransacao = "confirmada" | "pendente" | "cancelada";

export type StatusContaPagar = "pendente" | "paga" | "atrasada" | "cancelada";

export type CategoriaSaida =
  | "ferramentas"
  | "materiais"
  | "salarios"
  | "impostos"
  | "aluguel"
  | "energia"
  | "agua"
  | "internet"
  | "transporte"
  | "manutencao"
  | "outros";

export type CategoriaEntrada =
  | "servico_prestado"
  | "venda_produto"
  | "rendimento"
  | "outros";

export interface Transacao {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  documento_url: string | null;
  status: StatusTransacao;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_pagamento: string | null;
  status: StatusContaPagar;
  categoria: CategoriaSaida;
  recorrente: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FechamentoDiario {
  id: string;
  data: string;
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  quantidade_transacoes: number;
  created_at: string;
}

export interface FechamentoMensal {
  id: string;
  ano: number;
  mes: number;
  total_entradas: number;
  total_saidas: number;
  saldo: number;
  quantidade_transacoes: number;
  created_at: string;
}

export interface ResumoFinanceiro {
  saldo_atual: number;
  entradas_mes: number;
  saidas_mes: number;
  contas_a_pagar_pendentes: number;
  contas_a_pagar_atrasadas: number;
}
