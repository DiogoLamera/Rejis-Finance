"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Download,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  CalendarSearch,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardFechamento } from "@/components/relatorios/card-fechamento";
import { formatBRL, formatData, formatMesAno } from "@/lib/formatters";
import {
  useTransacoes,
  calcularFechamentoDia,
  calcularFechamentoMes,
  calcularFechamentoTrimestre,
  calcularFechamentoAno,
} from "@/lib/store/transacoes-store";
import {
  baixarRelatorioDiarioPDF,
  baixarRelatorioMensalPDF,
  baixarRelatorioTrimestralPDF,
  baixarRelatorioAnualPDF,
} from "@/lib/pdf/relatorio-pdf";

const NOMES_TRIMESTRES = ["1º", "2º", "3º", "4º"];
const INTERVALOS_TRIMESTRES = [
  "jan - mar",
  "abr - jun",
  "jul - set",
  "out - dez",
];

function dataParaInputDate(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function inputDateParaData(valor: string): Date {
  const [ano, mes, dia] = valor.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function dataParaInputMonth(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

const hoje = new Date();

function trimestreAtual(d: Date): number {
  return Math.floor(d.getMonth() / 3) + 1;
}

export default function RelatoriosPage() {
  const { transacoes } = useTransacoes();
  const [dataDia, setDataDia] = useState<Date>(hoje);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [anoTri, setAnoTri] = useState(hoje.getFullYear());
  const [trimestre, setTrimestre] = useState(trimestreAtual(hoje));
  const [anoAnual, setAnoAnual] = useState(hoje.getFullYear());

  const dataDiaISO = dataParaInputDate(dataDia);

  const fechamentoDia = useMemo(
    () => ({
      data: dataDiaISO,
      ...calcularFechamentoDia(transacoes, dataDia),
    }),
    [transacoes, dataDia, dataDiaISO],
  );

  const fechamentoMes = useMemo(
    () => ({
      ano,
      mes,
      ...calcularFechamentoMes(transacoes, ano, mes),
    }),
    [transacoes, ano, mes],
  );

  const transacoesDoDia = useMemo(
    () => transacoes.filter((t) => t.data === dataDiaISO),
    [transacoes, dataDiaISO],
  );

  const fechamentoTrimestre = useMemo(
    () => calcularFechamentoTrimestre(transacoes, anoTri, trimestre),
    [transacoes, anoTri, trimestre],
  );

  const fechamentoAno = useMemo(
    () => calcularFechamentoAno(transacoes, anoAnual),
    [transacoes, anoAnual],
  );

  const dataReferenciaMes = new Date(ano, mes - 1, 1);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">
          Atualizado em tempo real a partir das entradas e saídas cadastradas
        </p>
      </motion.div>

      {/* ============ FECHAMENTO DIÁRIO ============ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Fechamento Diário
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => baixarRelatorioDiarioPDF(dataDia, fechamentoDia)}
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="data-dia">Data do fechamento</Label>
              <Input
                id="data-dia"
                type="date"
                value={dataParaInputDate(dataDia)}
                onChange={(e) => {
                  if (e.target.value)
                    setDataDia(inputDateParaData(e.target.value));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Exibindo {formatData(dataDia, "EEEE, dd 'de' MMMM 'de' yyyy")}
              </p>
            </div>

            <CardFechamento
              key={dataDia.toISOString() + fechamentoDia.quantidade_transacoes}
              titulo={formatData(dataDia, "dd 'de' MMMM")}
              subtitulo={formatData(dataDia, "EEEE")}
              entradas={fechamentoDia.entradas}
              saidas={fechamentoDia.saidas}
              saldo={fechamentoDia.saldo}
              quantidadeTransacoes={fechamentoDia.quantidade_transacoes}
            />

            {transacoesDoDia.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transações contadas neste dia
                </p>
                <ul className="space-y-1.5">
                  {transacoesDoDia.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-md border border-border p-2 text-sm"
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        {t.tipo === "entrada" ? (
                          <TrendingUp className="h-3.5 w-3.5 shrink-0 text-success" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 shrink-0 text-destructive" />
                        )}
                        <span className="truncate">{t.descricao}</span>
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
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Sem movimentações nesta data. Cadastre entradas/saídas com a
                data de hoje para ver aqui automaticamente.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* ============ FECHAMENTO MENSAL ============ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Fechamento Mensal
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => baixarRelatorioMensalPDF(ano, mes, fechamentoMes)}
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="data-mes">Mês de referência</Label>
              <Input
                id="data-mes"
                type="month"
                value={dataParaInputMonth(ano, mes)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [novoAno, novoMes] = e.target.value
                    .split("-")
                    .map(Number);
                  setAno(novoAno);
                  setMes(novoMes);
                }}
              />
              <p className="text-xs capitalize text-muted-foreground">
                Exibindo {formatMesAno(dataReferenciaMes)}
              </p>
            </div>

            <CardFechamento
              key={`${ano}-${mes}-${fechamentoMes.quantidade_transacoes}`}
              titulo={
                formatMesAno(dataReferenciaMes).charAt(0).toUpperCase() +
                formatMesAno(dataReferenciaMes).slice(1)
              }
              subtitulo="Resultado consolidado do mês"
              entradas={fechamentoMes.entradas}
              saidas={fechamentoMes.saidas}
              saldo={fechamentoMes.saldo}
              quantidadeTransacoes={fechamentoMes.quantidade_transacoes}
            />
          </CardContent>
        </Card>
      </motion.section>

      {/* ============ FECHAMENTO TRIMESTRAL ============ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Fechamento Trimestral
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                baixarRelatorioTrimestralPDF(anoTri, trimestre, fechamentoTrimestre)
              }
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="ano-tri">Ano</Label>
                <Input
                  id="ano-tri"
                  type="number"
                  min={2000}
                  max={2100}
                  value={anoTri}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (Number.isFinite(n)) setAnoTri(n);
                  }}
                  className="w-32"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="trimestre">Trimestre</Label>
                <select
                  id="trimestre"
                  value={trimestre}
                  onChange={(e) => setTrimestre(parseInt(e.target.value, 10))}
                  className="flex h-10 w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {[1, 2, 3, 4].map((t) => (
                    <option key={t} value={t}>
                      {NOMES_TRIMESTRES[t - 1]} trimestre ({INTERVALOS_TRIMESTRES[t - 1]})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Exibindo {NOMES_TRIMESTRES[trimestre - 1]} trimestre de {anoTri} —
              meses {INTERVALOS_TRIMESTRES[trimestre - 1]}
            </p>

            <CardFechamento
              key={`tri-${anoTri}-${trimestre}-${fechamentoTrimestre.quantidade_transacoes}`}
              titulo={`${NOMES_TRIMESTRES[trimestre - 1]} trimestre de ${anoTri}`}
              subtitulo={`Resultado consolidado dos 3 meses (${INTERVALOS_TRIMESTRES[trimestre - 1]})`}
              entradas={fechamentoTrimestre.entradas}
              saidas={fechamentoTrimestre.saidas}
              saldo={fechamentoTrimestre.saldo}
              quantidadeTransacoes={fechamentoTrimestre.quantidade_transacoes}
            />
          </CardContent>
        </Card>
      </motion.section>

      {/* ============ FECHAMENTO ANUAL ============ */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <CalendarSearch className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold text-foreground">
                Fechamento Anual
              </CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => baixarRelatorioAnualPDF(anoAnual, fechamentoAno)}
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:max-w-xs">
              <Label htmlFor="ano-anual">Ano</Label>
              <Input
                id="ano-anual"
                type="number"
                min={2000}
                max={2100}
                value={anoAnual}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  if (Number.isFinite(n)) setAnoAnual(n);
                }}
                className="w-40"
              />
              <p className="text-xs text-muted-foreground">
                Exibindo o ano {anoAnual} completo (12 meses)
              </p>
            </div>

            <CardFechamento
              key={`anual-${anoAnual}-${fechamentoAno.quantidade_transacoes}`}
              titulo={`Ano ${anoAnual}`}
              subtitulo="Resultado consolidado dos 12 meses"
              entradas={fechamentoAno.entradas}
              saidas={fechamentoAno.saidas}
              saldo={fechamentoAno.saldo}
              quantidadeTransacoes={fechamentoAno.quantidade_transacoes}
            />
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
