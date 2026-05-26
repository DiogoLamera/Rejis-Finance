// Mock determinístico de fechamentos por data.
// Cada (ano, mês, dia) gera os mesmos valores — útil pra simular a UI antes da
// integração com Supabase. Substituir por queries reais quando o banco estiver
// configurado.

export interface FechamentoDia {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
  quantidade_transacoes: number;
}

export interface FechamentoMes {
  ano: number;
  mes: number;
  entradas: number;
  saidas: number;
  saldo: number;
  quantidade_transacoes: number;
}

function seeded(seed: number, min: number, max: number): number {
  const x = Math.sin(seed) * 10000;
  const r = x - Math.floor(x);
  return min + r * (max - min);
}

export function buscarFechamentoDia(data: Date): FechamentoDia {
  const seed =
    data.getFullYear() * 372 + (data.getMonth() + 1) * 31 + data.getDate();
  const entradas = Math.round(seeded(seed, 1500, 7500));
  const saidas = Math.round(seeded(seed * 7 + 13, 1200, 6800));
  return {
    data: data.toISOString().slice(0, 10),
    entradas,
    saidas,
    saldo: entradas - saidas,
    quantidade_transacoes: Math.round(seeded(seed * 13 + 7, 3, 14)),
  };
}

export function buscarFechamentoMes(ano: number, mes: number): FechamentoMes {
  const seed = ano * 12 + mes;
  const entradas = Math.round(seeded(seed, 28000, 75000));
  const saidas = Math.round(seeded(seed * 7 + 13, 22000, 68000));
  return {
    ano,
    mes,
    entradas,
    saidas,
    saldo: entradas - saidas,
    quantidade_transacoes: Math.round(seeded(seed * 13 + 7, 45, 140)),
  };
}
