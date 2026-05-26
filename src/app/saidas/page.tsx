"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Inbox, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BotaoDocumento } from "@/components/documento/botao-documento";
import {
  NovaTransacaoDialog,
  type NovaTransacaoInput,
} from "@/components/transacoes/nova-transacao-dialog";
import { formatBRL, formatData } from "@/lib/formatters";
import { useTransacoes } from "@/lib/store/transacoes-store";

const CATEGORIA_LABEL: Record<string, string> = {
  aluguel: "Aluguel",
  energia: "Energia",
  agua: "Água",
  internet: "Internet",
  salarios: "Salários",
  ferramentas: "Ferramentas",
  materiais: "Materiais",
  manutencao: "Manutenção",
  impostos: "Impostos",
  transporte: "Transporte",
  outros: "Outros",
};

export default function SaidasPage() {
  const { transacoes, adicionar, remover } = useTransacoes();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [idParaExcluir, setIdParaExcluir] = useState<string | null>(null);

  const saidas = transacoes.filter((t) => t.tipo === "saida");
  const total = saidas.reduce((acc, s) => acc + s.valor, 0);

  function handleSalvar(input: NovaTransacaoInput) {
    adicionar({
      tipo: "saida",
      descricao: input.descricao,
      valor: input.valor,
      data: input.data,
      categoria: input.categoria,
      documentoPath: input.documentoPath ?? null,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Saídas</h1>
          <p className="text-muted-foreground">
            Comprovantes de pagamento: ferramentas, materiais, salários, etc.
          </p>
        </div>
        <Button onClick={() => setDialogAberto(true)}>
          <Plus className="h-4 w-4" />
          Nova Saída
        </Button>
      </div>

      {saidas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total registrado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                {formatBRL(total)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Quantidade</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {saidas.length}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {saidas.length === 1 ? "saída" : "saídas"}
                </span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Lista de Saídas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {saidas.length === 0 ? (
              <motion.div
                key="vazio"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3 py-10 text-center"
              >
                <Inbox className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma saída cadastrada ainda.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogAberto(true)}
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar primeira saída
                </Button>
              </motion.div>
            ) : (
              <motion.ul
                key="lista"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {saidas.map((saida, i) => (
                  <motion.li
                    key={saida.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group flex items-center justify-between rounded-md border border-border p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <BotaoDocumento path={saida.documentoPath} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {saida.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORIA_LABEL[saida.categoria] ?? saida.categoria}{" "}
                          · {formatData(saida.data)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-sm font-bold text-destructive">
                        − {formatBRL(saida.valor)}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIdParaExcluir(saida.id)}
                        className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label="Excluir saída"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <NovaTransacaoDialog
        tipo="saida"
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onSalvar={handleSalvar}
      />

      <ConfirmDialog
        open={idParaExcluir !== null}
        onOpenChange={(aberto) => !aberto && setIdParaExcluir(null)}
        titulo="Excluir saída?"
        descricao="Essa ação não pode ser desfeita. O registro será removido permanentemente do banco de dados."
        textoConfirmar="Excluir"
        onConfirm={() => {
          if (idParaExcluir) remover(idParaExcluir);
          setIdParaExcluir(null);
        }}
      />
    </div>
  );
}
