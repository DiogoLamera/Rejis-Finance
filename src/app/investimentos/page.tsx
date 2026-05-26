"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Coins,
  Percent,
  Wallet,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { formatBRL } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { SugestaoInvestimento } from "@/app/api/investimentos/route";

const PRAZOS = [
  {
    value: "curto",
    label: "Curto prazo",
    intervalo: "até 1 ano",
    desc: "Foco em liquidez. Dinheiro disponível a qualquer momento.",
  },
  {
    value: "medio",
    label: "Médio prazo",
    intervalo: "1 a 3 anos",
    desc: "Balanço entre rentabilidade e liquidez.",
  },
  {
    value: "longo",
    label: "Longo prazo",
    intervalo: "mais de 3 anos",
    desc: "Foco em rentabilidade real (acima da inflação).",
  },
];

const RISCO_CONFIG: Record<
  string,
  { cor: string; bg: string; label: string }
> = {
  "Muito baixo": {
    cor: "text-success",
    bg: "bg-success/10 border-success/30",
    label: "Muito baixo",
  },
  Baixo: {
    cor: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    label: "Baixo",
  },
  "Médio": {
    cor: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    label: "Médio",
  },
  Alto: {
    cor: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
    label: "Alto",
  },
};

export default function InvestimentosPage() {
  const [valor, setValor] = useState("");
  const [prazo, setPrazo] = useState("medio");
  const [analisando, setAnalisando] = useState(false);
  const [sugestoes, setSugestoes] = useState<SugestaoInvestimento[] | null>(
    null,
  );
  const [valorAnalisado, setValorAnalisado] = useState<number | null>(null);
  const [prazoAnalisado, setPrazoAnalisado] = useState<string | null>(null);

  async function analisar() {
    const numero = parseFloat(valor || "0");
    if (!numero || numero <= 0) {
      toast.error("Informe o valor que deseja investir");
      return;
    }

    setAnalisando(true);
    setSugestoes(null);
    try {
      const res = await fetch("/api/investimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ valor: numero, prazo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao gerar sugestões");
      setSugestoes(data.sugestoes);
      setValorAnalisado(numero);
      setPrazoAnalisado(prazo);
      toast.success("Análise concluída", {
        description: `${data.sugestoes.length} sugestões geradas pra você.`,
      });
    } catch (e) {
      toast.error("Erro ao analisar investimentos", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setAnalisando(false);
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold">Investimentos</h1>
        <p className="text-muted-foreground">
          Informe o valor e o prazo — a IA sugere as melhores opções pro seu
          perfil
        </p>
      </motion.div>

      {/* ============ FORMULÁRIO ============ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Configurar análise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor de investimento</Label>
                <CurrencyInput
                  id="valor"
                  value={valor}
                  onValueChange={setValor}
                  disabled={analisando}
                />
                <p className="text-xs text-muted-foreground">
                  Quanto você quer investir agora
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo do investimento</Label>
                <select
                  id="prazo"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  disabled={analisando}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {PRAZOS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label} — {p.intervalo}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {PRAZOS.find((p) => p.value === prazo)?.desc}
                </p>
              </div>
            </div>

            <Button
              onClick={analisar}
              disabled={analisando}
              className="w-full sm:w-auto"
            >
              {analisando ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  Analisando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Confirmar e gerar sugestões
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ============ LOADING ============ */}
      <AnimatePresence>
        {analisando && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="py-10">
                <Spinner
                  fullHeight
                  label="Buscando os melhores investimentos com IA..."
                />
                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Geralmente leva 5-15 segundos
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ RESULTADOS ============ */}
      <AnimatePresence>
        {!analisando && sugestoes && sugestoes.length > 0 && (
          <motion.section
            key={`resultados-${valorAnalisado}-${prazoAnalisado}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Sugestões para você
                </h2>
                <p className="text-sm text-muted-foreground">
                  Análise pra{" "}
                  <span className="font-medium text-foreground">
                    {valorAnalisado && formatBRL(valorAnalisado)}
                  </span>{" "}
                  em{" "}
                  <span className="font-medium text-foreground">
                    {PRAZOS.find((p) => p.value === prazoAnalisado)?.label.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {sugestoes.map((s, i) => (
                <CardSugestao key={i} sugestao={s} delay={i * 0.08} />
              ))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ============ DISCLAIMER ============ */}
      <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">
            As sugestões são geradas por IA e têm caráter apenas informativo.
          </span>{" "}
          Não substituem a orientação de um profissional certificado (CFP, CGA).
          Taxas e condições variam por instituição — sempre confirme antes de
          investir.
        </p>
      </div>
    </div>
  );
}

function CardSugestao({
  sugestao,
  delay,
}: {
  sugestao: SugestaoInvestimento;
  delay: number;
}) {
  const riscoConfig = RISCO_CONFIG[sugestao.risco] ?? RISCO_CONFIG["Médio"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-foreground">
                {sugestao.nome}
              </h3>
              <p className="text-xs text-muted-foreground">{sugestao.tipo}</p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                riscoConfig.cor,
                riscoConfig.bg,
              )}
            >
              {riscoConfig.label}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <DetalheLinha
              icone={<Percent className="h-3.5 w-3.5" />}
              rotulo="Rentabilidade"
              valor={sugestao.rentabilidade_estimada}
            />
            <DetalheLinha
              icone={<Clock className="h-3.5 w-3.5" />}
              rotulo="Liquidez"
              valor={sugestao.liquidez}
            />
            <DetalheLinha
              icone={<Coins className="h-3.5 w-3.5" />}
              rotulo="Mínimo"
              valor={sugestao.aplicacao_minima}
            />
            <DetalheLinha
              icone={<Wallet className="h-3.5 w-3.5" />}
              rotulo="Impostos"
              valor={sugestao.imposto}
            />
          </div>

          <div className="space-y-3 border-t border-border pt-3">
            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="h-3 w-3" />O que é
              </p>
              <p className="text-sm leading-relaxed">{sugestao.explicacao}</p>
            </div>

            <div>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <ShieldCheck className="h-3 w-3" />
                Por que pra você
              </p>
              <p className="text-sm leading-relaxed">
                {sugestao.justificativa}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DetalheLinha({
  icone,
  rotulo,
  valor,
}: {
  icone: React.ReactNode;
  rotulo: string;
  valor: string;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icone}
        {rotulo}
      </p>
      <p className="text-xs font-medium">{valor}</p>
    </div>
  );
}
