"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "@/lib/formatters";
import type { Transacao } from "@/lib/store/transacoes-store";

interface FluxoMesGraficoProps {
  transacoes: Transacao[];
  ano: number;
  mes: number; // 1-12
}

export function FluxoMesGrafico({ transacoes, ano, mes }: FluxoMesGraficoProps) {
  const dados = useMemo(() => {
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const mesStr = `${ano}-${String(mes).padStart(2, "0")}`;
    const porDia = new Map<number, { entradas: number; saidas: number }>();

    for (let dia = 1; dia <= ultimoDia; dia++) {
      porDia.set(dia, { entradas: 0, saidas: 0 });
    }

    for (const t of transacoes) {
      if (!t.data.startsWith(mesStr)) continue;
      const dia = parseInt(t.data.slice(8, 10), 10);
      const reg = porDia.get(dia);
      if (!reg) continue;
      if (t.tipo === "entrada") reg.entradas += t.valor;
      else reg.saidas += t.valor;
    }

    return Array.from(porDia.entries()).map(([dia, valores]) => ({
      dia: String(dia).padStart(2, "0"),
      entradas: valores.entradas,
      saidas: valores.saidas,
    }));
  }, [transacoes, ano, mes]);

  const temDados = dados.some((d) => d.entradas > 0 || d.saidas > 0);

  if (!temDados) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma movimentação registrada neste mês ainda. Cadastre entradas e
        saídas para ver o gráfico.
      </p>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="dia"
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => [
              formatBRL(value),
              name === "entradas" ? "Entradas" : "Saídas",
            ]}
            labelFormatter={(label: string) => `Dia ${label}`}
          />
          <Bar
            dataKey="entradas"
            fill="hsl(var(--success))"
            radius={[3, 3, 0, 0]}
          />
          <Bar
            dataKey="saidas"
            fill="hsl(var(--destructive))"
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
