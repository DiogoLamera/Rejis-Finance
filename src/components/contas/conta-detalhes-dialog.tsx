"use client";

import { motion } from "motion/react";
import {
  Calendar,
  Tag,
  CircleCheck,
  CircleAlert,
  Clock,
  Download,
  Printer,
  FileText,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BotaoDocumento } from "@/components/documento/botao-documento";
import { formatBRL, formatData } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { baixarContaPDF, imprimirContaPDF } from "@/lib/pdf/conta-pdf";
import type { ContaParaPDF } from "@/lib/pdf/conta-pdf";

interface ContaDetalhesDialogProps {
  conta: ContaParaPDF | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExcluir?: (id: string) => void;
}

const STATUS_CONFIG = {
  pendente: {
    label: "Pendente",
    icone: Clock,
    classe: "text-amber-500 bg-amber-500/10 border-amber-500/30",
  },
  paga: {
    label: "Paga",
    icone: CircleCheck,
    classe: "text-primary bg-primary/10 border-primary/30",
  },
  atrasada: {
    label: "Atrasada",
    icone: CircleAlert,
    classe: "text-destructive bg-destructive/10 border-destructive/30",
  },
} as const;

export function ContaDetalhesDialog({
  conta,
  open,
  onOpenChange,
  onExcluir,
}: ContaDetalhesDialogProps) {
  if (!conta) return null;

  const status = STATUS_CONFIG[conta.status];
  const IconeStatus = status.icone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Detalhes da Conta
          </DialogTitle>
          <DialogDescription>
            Visualize, imprima ou baixe os dados desta conta.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição
            </p>
            <p className="text-base font-semibold">{conta.descricao}</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Valor
            </p>
            <p className="text-3xl font-bold">{formatBRL(conta.valor)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info
              icone={<Calendar className="h-4 w-4" />}
              rotulo="Vencimento"
              valor={formatData(
                typeof conta.data_vencimento === "string"
                  ? conta.data_vencimento
                  : conta.data_vencimento.toISOString().slice(0, 10),
              )}
            />
            <Info
              icone={<Tag className="h-4 w-4" />}
              rotulo="Categoria"
              valor={
                conta.categoria.charAt(0).toUpperCase() +
                conta.categoria.slice(1)
              }
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                status.classe,
              )}
            >
              <IconeStatus className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>

          {conta.observacoes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observações
              </p>
              <p className="text-sm">{conta.observacoes}</p>
            </div>
          )}

          {conta.documentoPath && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documento anexado
              </p>
              <div className="flex gap-2">
                <BotaoDocumento
                  variante="completo"
                  path={conta.documentoPath}
                  label="Visualizar"
                />
                <BotaoDocumento
                  variante="completo"
                  path={conta.documentoPath}
                  label="Baixar"
                  download
                />
              </div>
            </div>
          )}
        </motion.div>

        <DialogFooter className="flex-col gap-2 sm:flex-col sm:gap-2">
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={() => imprimirContaPDF(conta)}
              className="flex-1"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={() => baixarContaPDF(conta)} className="flex-1">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
          {onExcluir && (
            <Button
              variant="destructive"
              onClick={() => onExcluir(conta.id)}
              className="w-full"
            >
              <Trash2 className="h-4 w-4" />
              Excluir conta
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({
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
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icone}
        {rotulo}
      </p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}
