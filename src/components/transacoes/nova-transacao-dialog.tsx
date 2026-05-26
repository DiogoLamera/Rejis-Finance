"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  X,
  Sparkles,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Tipo = "entrada" | "saida";

const CATEGORIAS_ENTRADA = [
  { value: "servico_prestado", label: "Serviço prestado" },
  { value: "venda_produto", label: "Venda de produto" },
  { value: "rendimento", label: "Rendimento" },
  { value: "outros", label: "Outros" },
];

const CATEGORIAS_SAIDA = [
  { value: "aluguel", label: "Aluguel" },
  { value: "energia", label: "Energia" },
  { value: "agua", label: "Água" },
  { value: "internet", label: "Internet" },
  { value: "salarios", label: "Salários" },
  { value: "ferramentas", label: "Ferramentas" },
  { value: "materiais", label: "Materiais" },
  { value: "manutencao", label: "Manutenção" },
  { value: "impostos", label: "Impostos" },
  { value: "transporte", label: "Transporte" },
  { value: "outros", label: "Outros" },
];

export interface NovaTransacaoInput {
  tipo: Tipo;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  categoria: string;
  documentoPath?: string | null;
}

interface NovaTransacaoDialogProps {
  tipo: Tipo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvar: (dados: NovaTransacaoInput) => void;
}

export function NovaTransacaoDialog({
  tipo,
  open,
  onOpenChange,
  onSalvar,
}: NovaTransacaoDialogProps) {
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [documentoPath, setDocumentoPath] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(() => dataHojeISO());
  const categoriaPadrao = tipo === "entrada" ? "servico_prestado" : "outros";
  const [categoria, setCategoria] = useState(categoriaPadrao);
  const [extraindo, setExtraindo] = useState(false);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [campoExtraido, setCampoExtraido] = useState<string[]>([]);

  const categorias = tipo === "entrada" ? CATEGORIAS_ENTRADA : CATEGORIAS_SAIDA;
  const categoriasValidas = new Set(categorias.map((c) => c.value));

  const textos =
    tipo === "entrada"
      ? {
          titulo: "Nova Entrada",
          descricao:
            "Cadastre uma nota fiscal recebida ou outro tipo de recebimento. Anexe o documento e a IA preenche os campos.",
          tituloCampoNome: "Descrição",
          placeholderNome: "Ex: Serviço prestado a Cliente X",
          uploadHint: "Anexe a nota fiscal (PDF ou imagem)",
          botaoSalvar: "Cadastrar Entrada",
          icone: <TrendingUp className="h-5 w-5 text-success" />,
        }
      : {
          titulo: "Nova Saída",
          descricao:
            "Cadastre um comprovante de pagamento ou outra despesa. Anexe o documento e a IA preenche os campos.",
          tituloCampoNome: "Descrição",
          placeholderNome: "Ex: Compra de materiais",
          uploadHint: "Anexe o comprovante (PDF ou imagem)",
          botaoSalvar: "Cadastrar Saída",
          icone: <TrendingDown className="h-5 w-5 text-destructive" />,
        };

  function resetar() {
    setArquivo(null);
    setDocumentoPath(null);
    setDescricao("");
    setValor("");
    setData(dataHojeISO());
    setCategoria(categoriaPadrao);
    setExtraindo(false);
    setEnviandoArquivo(false);
    setCampoExtraido([]);
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
  }

  function handleClose() {
    resetar();
    onOpenChange(false);
  }

  async function extrairDoArquivo(file: File) {
    setExtraindo(true);
    setCampoExtraido([]);
    try {
      const formData = new FormData();
      formData.append("arquivo", file);

      const resposta = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        toast.error(dados.error ?? "Falha ao ler o documento", {
          description: "Você pode preencher os campos manualmente abaixo.",
        });
        return;
      }

      const preenchidos: string[] = [];
      if (dados.descricao) {
        setDescricao(dados.descricao);
        preenchidos.push("descricao");
      }
      if (dados.valor && Number.isFinite(dados.valor)) {
        setValor(String(dados.valor));
        preenchidos.push("valor");
      }
      if (dados.data && /^\d{4}-\d{2}-\d{2}$/.test(dados.data)) {
        setData(dados.data);
        preenchidos.push("data");
      }
      if (dados.categoria && categoriasValidas.has(dados.categoria)) {
        setCategoria(dados.categoria);
        preenchidos.push("categoria");
      }

      setCampoExtraido(preenchidos);

      if (preenchidos.length > 0) {
        toast.success("Dados extraídos do documento!", {
          description: `${preenchidos.length} campo(s) preenchido(s) automaticamente.`,
        });
      } else {
        toast.warning(
          "Documento processado, mas nenhum dado pôde ser extraído.",
        );
      }
    } catch (erro) {
      console.error(erro);
      toast.error("Erro ao processar o arquivo", {
        description: "Você pode preencher os campos manualmente.",
      });
    } finally {
      setExtraindo(false);
    }
  }

  async function enviarParaStorage(file: File) {
    setEnviandoArquivo(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", file);
      formData.append("escopo", "transacao");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha no upload");
      setDocumentoPath(json.path);
    } catch (e) {
      toast.error("Erro ao enviar o documento", {
        description: e instanceof Error ? e.message : undefined,
      });
      setDocumentoPath(null);
    } finally {
      setEnviandoArquivo(false);
    }
  }

  function handleArquivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivo(file);
    setDocumentoPath(null);
    // Dispara upload + OCR em paralelo
    enviarParaStorage(file);
    extrairDoArquivo(file);
  }

  function handleRemoverArquivo() {
    setArquivo(null);
    setDocumentoPath(null);
    setCampoExtraido([]);
    if (inputArquivoRef.current) inputArquivoRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao || !valor || !data) {
      toast.error("Preencha descrição, valor e data");
      return;
    }
    if (enviandoArquivo) {
      toast.error("Aguarde o upload do documento terminar antes de salvar");
      return;
    }
    onSalvar({
      tipo,
      descricao,
      valor: parseFloat(valor),
      data,
      categoria,
      documentoPath: documentoPath ?? null,
    });
    toast.success(
      tipo === "entrada"
        ? "Entrada cadastrada com sucesso!"
        : "Saída cadastrada com sucesso!",
    );
    resetar();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : handleClose())}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {textos.icone}
            {textos.titulo}
          </DialogTitle>
          <DialogDescription>{textos.descricao}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {textos.uploadHint}
            </Label>

            <AnimatePresence mode="wait">
              {!arquivo ? (
                <motion.button
                  key="upload"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => inputArquivoRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-border bg-muted/30 px-6 py-5 text-sm transition-colors hover:border-primary hover:bg-muted"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Clique para anexar</span>
                  <span className="text-xs text-muted-foreground">
                    PDF ou imagem (JPEG, PNG, WEBP)
                  </span>
                </motion.button>
              ) : (
                <motion.div
                  key="arquivo"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-sm font-medium">
                      {arquivo.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoverArquivo}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Remover arquivo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <input
              ref={inputArquivoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleArquivoChange}
              className="hidden"
            />

            <AnimatePresence>
              {(extraindo || enviandoArquivo) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 p-3"
                >
                  <Spinner size={24} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">
                      {extraindo && enviandoArquivo
                        ? "Lendo com IA e salvando arquivo..."
                        : extraindo
                          ? "Lendo o documento com IA..."
                          : "Enviando arquivo..."}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pode levar alguns segundos
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!extraindo && !enviandoArquivo && documentoPath && (
              <p className="text-xs font-medium text-primary">
                ✓ Upload concluído
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              ou preencha manualmente
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Campos */}
          <div className="space-y-2">
            <Label htmlFor="descricao">
              {textos.tituloCampoNome}{" "}
              {campoExtraido.includes("descricao") && <BadgeIA />}
            </Label>
            <Input
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={textos.placeholderNome}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="valor">
                Valor {campoExtraido.includes("valor") && <BadgeIA />}
              </Label>
              <CurrencyInput
                id="valor"
                value={valor}
                onValueChange={setValor}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data">
                Data {campoExtraido.includes("data") && <BadgeIA />}
              </Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">
              Categoria{" "}
              {campoExtraido.includes("categoria") && <BadgeIA />}
            </Label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
            >
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {arquivo && !extraindo && campoExtraido.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-muted-foreground">
                Nenhum campo foi extraído automaticamente. Verifique se a chave
                da Claude API está configurada ou preencha manualmente.
              </p>
            </motion.div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={extraindo || enviandoArquivo}
              className="flex-1 sm:flex-none"
            >
              {textos.botaoSalvar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function dataHojeISO(): string {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function BadgeIA() {
  return (
    <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
      <Sparkles className="h-2.5 w-2.5" />
      IA
    </span>
  );
}
