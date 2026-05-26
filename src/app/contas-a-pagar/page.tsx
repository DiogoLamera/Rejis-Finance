"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { addDays, isSameDay, isWithinInterval, startOfDay } from "date-fns";
import { Plus, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Spinner } from "@/components/ui/spinner";
import { ContaDetalhesDialog } from "@/components/contas/conta-detalhes-dialog";
import {
  NovaContaDialog,
  type NovaContaInput,
} from "@/components/contas/nova-conta-dialog";
import { formatBRL, formatData } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useContas, type Conta } from "@/lib/store/contas-store";

const hoje = startOfDay(new Date());

export default function ContasAPagarPage() {
  const { contas, carregando, adicionar } = useContas();
  const [diaSelecionado, setDiaSelecionado] = useState<Date | undefined>(hoje);
  const [contaAberta, setContaAberta] = useState<Conta | null>(null);
  const [novaContaAberto, setNovaContaAberto] = useState(false);

  function handleSalvarNovaConta(input: NovaContaInput) {
    const dataVenc = new Date(input.data_vencimento + "T00:00:00");
    adicionar({
      descricao: input.descricao,
      valor: input.valor,
      data_vencimento: dataVenc,
      categoria: input.categoria,
      recorrente: false,
      documentoPath: input.documentoPath ?? null,
    });
    setDiaSelecionado(dataVenc);
  }

  const { contasAtrasadas, contasSemana, contasPendentes, contasPagas } =
    useMemo(() => {
      const fimSemana = addDays(hoje, 7);
      return {
        contasAtrasadas: contas.filter((c) => c.status === "atrasada"),
        contasSemana: contas.filter(
          (c) =>
            c.status === "pendente" &&
            isWithinInterval(c.data_vencimento, {
              start: hoje,
              end: fimSemana,
            }),
        ),
        contasPendentes: contas.filter((c) => c.status === "pendente"),
        contasPagas: contas.filter((c) => c.status === "paga"),
      };
    }, [contas]);

  const totalPendente = contas
    .filter((c) => c.status !== "paga")
    .reduce((acc, c) => acc + c.valor, 0);

  const contasDoDia = useMemo(() => {
    if (!diaSelecionado) return [];
    return contas.filter((c) =>
      isSameDay(c.data_vencimento, diaSelecionado),
    );
  }, [contas, diaSelecionado]);

  const diasAtrasados = contasAtrasadas.map((c) => c.data_vencimento);
  const diasPendentes = contasPendentes.map((c) => c.data_vencimento);
  const diasPagos = contasPagas.map((c) => c.data_vencimento);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">
            Organize as despesas futuras e não perca prazos de vencimento
          </p>
        </div>
        <Button onClick={() => setNovaContaAberto(true)}>
          <Plus className="h-4 w-4" />
          Nova Conta
        </Button>
      </div>

      {carregando ? (
        <Spinner fullHeight label="Carregando contas..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ResumoCard
              titulo="Em Atraso"
              quantidade={contasAtrasadas.length}
              valor={contasAtrasadas.reduce((a, c) => a + c.valor, 0)}
              icone={<AlertCircle className="h-4 w-4" />}
              variante="destructive"
              delay={0.05}
            />
            <ResumoCard
              titulo="Vence Esta Semana"
              quantidade={contasSemana.length}
              valor={contasSemana.reduce((a, c) => a + c.valor, 0)}
              icone={<Clock className="h-4 w-4" />}
              variante="warning"
              delay={0.1}
            />
            <ResumoCard
              titulo="Total Pendente"
              quantidade={contas.filter((c) => c.status !== "paga").length}
              valor={totalPendente}
              icone={<CheckCircle2 className="h-4 w-4" />}
              variante="default"
              delay={0.15}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr]">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Calendário de Vencimentos
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <Legenda cor="bg-primary" label="Paga" />
                    <Legenda cor="bg-amber-500" label="Pendente / Futura" />
                    <Legenda cor="bg-destructive" label="Atrasada" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={diaSelecionado}
                    onSelect={setDiaSelecionado}
                    captionLayout="dropdown"
                    startMonth={new Date(new Date().getFullYear() - 3, 0)}
                    endMonth={new Date(new Date().getFullYear() + 5, 11)}
                    onMonthChange={(novoMes) => {
                      const base = diaSelecionado ?? hoje;
                      const diaDoMes = base.getDate();
                      const ultimoDia = new Date(
                        novoMes.getFullYear(),
                        novoMes.getMonth() + 1,
                        0,
                      ).getDate();
                      setDiaSelecionado(
                        new Date(
                          novoMes.getFullYear(),
                          novoMes.getMonth(),
                          Math.min(diaDoMes, ultimoDia),
                        ),
                      );
                    }}
                    modifiers={{
                      "conta-dia-paga": diasPagos,
                      "conta-dia-pendente": diasPendentes,
                      "conta-dia-atrasada": diasAtrasados,
                    }}
                    modifiersClassNames={{
                      "conta-dia-paga": "conta-dia-paga",
                      "conta-dia-pendente": "conta-dia-pendente",
                      "conta-dia-atrasada": "conta-dia-atrasada",
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-foreground">
                    {diaSelecionado
                      ? `Contas de ${formatData(diaSelecionado, "dd 'de' MMMM")}`
                      : "Selecione um dia"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {contasDoDia.length === 0 ? (
                      <motion.p
                        key="vazio"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-muted-foreground"
                      >
                        Nenhuma conta com vencimento neste dia.
                      </motion.p>
                    ) : (
                      <motion.ul
                        key={diaSelecionado?.toISOString()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-2"
                      >
                        {contasDoDia.map((conta, i) => (
                          <motion.li
                            key={conta.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <button
                              type="button"
                              onClick={() => setContaAberta(conta)}
                              className={cn(
                                "group flex w-full items-center justify-between rounded-md border border-border p-3 text-left transition-all hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                conta.status === "atrasada" &&
                                  "border-destructive/50 bg-destructive/5 hover:border-destructive",
                                conta.status === "paga" && "opacity-75",
                              )}
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {conta.descricao}
                                </p>
                                <p className="text-xs capitalize text-muted-foreground">
                                  {conta.categoria}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold">
                                  {formatBRL(conta.valor)}
                                </p>
                                {conta.status === "atrasada" && (
                                  <p className="text-xs font-medium text-destructive">
                                    Atrasada
                                  </p>
                                )}
                                {conta.status === "paga" && (
                                  <p className="text-xs font-medium text-primary">
                                    Paga
                                  </p>
                                )}
                              </div>
                            </button>
                          </motion.li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}

      <ContaDetalhesDialog
        conta={
          contaAberta
            ? {
                id: contaAberta.id,
                descricao: contaAberta.descricao,
                valor: contaAberta.valor,
                data_vencimento: contaAberta.data_vencimento,
                data_pagamento: contaAberta.data_pagamento,
                categoria: contaAberta.categoria,
                status:
                  contaAberta.status === "cancelada"
                    ? "pendente"
                    : contaAberta.status,
                observacoes: null,
                documentoPath: contaAberta.documentoPath,
              }
            : null
        }
        open={contaAberta !== null}
        onOpenChange={(aberto) => !aberto && setContaAberta(null)}
      />

      <NovaContaDialog
        open={novaContaAberto}
        onOpenChange={setNovaContaAberto}
        onSalvar={handleSalvarNovaConta}
      />
    </div>
  );
}

function Legenda({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", cor)} />
      {label}
    </span>
  );
}

function ResumoCard({
  titulo,
  quantidade,
  valor,
  icone,
  variante,
  delay,
}: {
  titulo: string;
  quantidade: number;
  valor: number;
  icone: React.ReactNode;
  variante: "default" | "destructive" | "warning";
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{titulo}</CardTitle>
          <div
            className={cn(
              variante === "destructive" && "text-destructive",
              variante === "warning" && "text-amber-500",
              variante === "default" && "text-muted-foreground",
            )}
          >
            {icone}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              variante === "destructive" && "text-destructive",
            )}
          >
            {quantidade}
          </div>
          <p className="text-xs text-muted-foreground">{formatBRL(valor)}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
