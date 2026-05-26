"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Wallet, CalendarClock } from "lucide-react";
import { CardResumo } from "@/components/dashboard/card-resumo";
import { StaggerContainer } from "@/components/dashboard/stagger-container";
import { FluxoMesGrafico } from "@/components/dashboard/fluxo-mes-grafico";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useTransacoes,
  calcularFechamentoMes,
} from "@/lib/store/transacoes-store";
import { formatBRL, formatData, formatMesAno } from "@/lib/formatters";

export default function DashboardPage() {
  const { transacoes } = useTransacoes();

  const { ano, mes, hojeFmt } = useMemo(() => {
    const h = new Date();
    return {
      ano: h.getFullYear(),
      mes: h.getMonth() + 1,
      hojeFmt: h,
    };
  }, []);

  const fechamentoMes = useMemo(
    () => calcularFechamentoMes(transacoes, ano, mes),
    [transacoes, ano, mes],
  );

  const ultimasTransacoes = useMemo(
    () =>
      [...transacoes]
        .sort((a, b) => (a.data < b.data ? 1 : -1))
        .slice(0, 5),
    [transacoes],
  );

  return (
    <div className="space-y-6">
      <StaggerContainer>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da situação financeira da empresa
        </p>
      </StaggerContainer>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CardResumo
          titulo="Saldo do Mês"
          valor={fechamentoMes.saldo}
          icone={<Wallet className="h-4 w-4" />}
          variante={fechamentoMes.saldo >= 0 ? "success" : "destructive"}
          descricao={`Em ${formatMesAno(hojeFmt)}`}
          delay={0.1}
        />
        <CardResumo
          titulo="Entradas do Mês"
          valor={fechamentoMes.entradas}
          icone={<TrendingUp className="h-4 w-4" />}
          variante="success"
          delay={0.15}
        />
        <CardResumo
          titulo="Saídas do Mês"
          valor={fechamentoMes.saidas}
          icone={<TrendingDown className="h-4 w-4" />}
          variante="destructive"
          delay={0.2}
        />
        <CardResumo
          titulo="Transações no Mês"
          valor={fechamentoMes.quantidade_transacoes}
          icone={<CalendarClock className="h-4 w-4" />}
          descricao="Entradas + saídas combinadas"
          delay={0.25}
          formato="numero"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <StaggerContainer delay={0.35} className="lg:col-span-2">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Fluxo do Mês
              </CardTitle>
              <p className="text-xs text-muted-foreground capitalize">
                Entradas (verde) vs Saídas (vermelho) por dia em{" "}
                {formatMesAno(hojeFmt)}
              </p>
            </CardHeader>
            <CardContent>
              <FluxoMesGrafico transacoes={transacoes} ano={ano} mes={mes} />
            </CardContent>
          </Card>
        </StaggerContainer>

        <StaggerContainer delay={0.4}>
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Últimas Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ultimasTransacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma transação cadastrada ainda.
                </p>
              ) : (
                <ul className="space-y-2">
                  {ultimasTransacoes.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{t.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatData(t.data)}
                        </p>
                      </div>
                      <span
                        className={
                          t.tipo === "entrada"
                            ? "shrink-0 font-semibold text-success"
                            : "shrink-0 font-semibold text-destructive"
                        }
                      >
                        {t.tipo === "entrada" ? "+" : "−"} {formatBRL(t.valor)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </StaggerContainer>
      </div>
    </div>
  );
}
