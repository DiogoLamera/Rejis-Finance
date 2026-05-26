"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

export type TipoTransacao = "entrada" | "saida";

export interface Transacao {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  categoria: string;
  documentoPath: string | null;
  criadoEm: string;
}

interface TransacoesContextValor {
  transacoes: Transacao[];
  carregando: boolean;
  adicionar: (t: Omit<Transacao, "id" | "criadoEm">) => void;
  remover: (id: string) => void;
  recarregar: () => Promise<void>;
}

const TransacoesContext = createContext<TransacoesContextValor | null>(null);

interface TransacaoRow {
  id: string;
  tipo: TipoTransacao;
  descricao: string;
  valor: string | number;
  data: string;
  categoria: string;
  documento_url: string | null;
  created_at: string;
}

function mapearDoBanco(row: TransacaoRow): Transacao {
  return {
    id: row.id,
    tipo: row.tipo,
    descricao: row.descricao,
    valor:
      typeof row.valor === "string" ? parseFloat(row.valor) : row.valor,
    data: row.data,
    categoria: row.categoria,
    documentoPath: row.documento_url,
    criadoEm: row.created_at,
  };
}

export function TransacoesProvider({ children }: { children: ReactNode }) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      const res = await fetch("/api/transacoes", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao carregar");
      const lista = (json.transacoes ?? []) as TransacaoRow[];
      setTransacoes(lista.map(mapearDoBanco));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar transações", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const adicionar = useCallback(
    (input: Omit<Transacao, "id" | "criadoEm">) => {
      // Optimistic update: aparece na lista imediatamente
      const tempId = `tmp_${crypto.randomUUID()}`;
      const otimista: Transacao = {
        ...input,
        id: tempId,
        criadoEm: new Date().toISOString(),
      };
      setTransacoes((curr) => [otimista, ...curr]);

      fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: input.tipo,
          descricao: input.descricao,
          valor: input.valor,
          data: input.data,
          categoria: input.categoria,
          documento_url: input.documentoPath ?? null,
        }),
      })
        .then(async (res) => {
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? "Falha");
          // Troca a versão otimista pela real do banco
          setTransacoes((curr) =>
            curr.map((t) =>
              t.id === tempId ? mapearDoBanco(json.transacao) : t,
            ),
          );
        })
        .catch((e) => {
          // Reverte o optimistic update
          setTransacoes((curr) => curr.filter((t) => t.id !== tempId));
          toast.error("Erro ao salvar transação", {
            description: e instanceof Error ? e.message : undefined,
          });
        });
    },
    [],
  );

  const remover = useCallback((id: string) => {
    // Optimistic: remove já da UI
    const anterior = transacoes;
    setTransacoes((curr) => curr.filter((t) => t.id !== id));

    fetch(`/api/transacoes/${id}`, { method: "DELETE" })
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "Falha");
        }
      })
      .catch((e) => {
        // Reverte: traz a transação de volta
        setTransacoes(anterior);
        toast.error("Erro ao remover transação", {
          description: e instanceof Error ? e.message : undefined,
        });
      });
  }, [transacoes]);

  const valor = useMemo(
    () => ({ transacoes, carregando, adicionar, remover, recarregar }),
    [transacoes, carregando, adicionar, remover, recarregar],
  );

  return (
    <TransacoesContext.Provider value={valor}>
      {children}
    </TransacoesContext.Provider>
  );
}

export function useTransacoes() {
  const ctx = useContext(TransacoesContext);
  if (!ctx)
    throw new Error("useTransacoes deve ser usado dentro de TransacoesProvider");
  return ctx;
}

// ============================================================================
// Helpers de agregação (inalterados — funcionam sobre o array já carregado)
// ============================================================================

export interface FechamentoCalculado {
  entradas: number;
  saidas: number;
  saldo: number;
  quantidade_transacoes: number;
}

export function calcularFechamentoDia(
  transacoes: Transacao[],
  data: Date,
): FechamentoCalculado {
  const dataStr = formatarDataISO(data);
  const filtradas = transacoes.filter((t) => t.data === dataStr);
  return agregar(filtradas);
}

export function calcularFechamentoMes(
  transacoes: Transacao[],
  ano: number,
  mes: number,
): FechamentoCalculado {
  const mesStr = `${ano}-${String(mes).padStart(2, "0")}`;
  const filtradas = transacoes.filter((t) => t.data.startsWith(mesStr));
  return agregar(filtradas);
}

export function calcularFechamentoTrimestre(
  transacoes: Transacao[],
  ano: number,
  trimestre: number,
): FechamentoCalculado {
  const mesInicio = (trimestre - 1) * 3 + 1;
  const mesFim = trimestre * 3;
  const filtradas = transacoes.filter((t) => {
    const partes = t.data.split("-");
    if (partes.length < 2) return false;
    const tAno = parseInt(partes[0], 10);
    const tMes = parseInt(partes[1], 10);
    return tAno === ano && tMes >= mesInicio && tMes <= mesFim;
  });
  return agregar(filtradas);
}

export function calcularFechamentoAno(
  transacoes: Transacao[],
  ano: number,
): FechamentoCalculado {
  const prefixo = `${ano}-`;
  const filtradas = transacoes.filter((t) => t.data.startsWith(prefixo));
  return agregar(filtradas);
}

function agregar(transacoes: Transacao[]): FechamentoCalculado {
  let entradas = 0;
  let saidas = 0;
  for (const t of transacoes) {
    if (t.tipo === "entrada") entradas += t.valor;
    else saidas += t.valor;
  }
  return {
    entradas,
    saidas,
    saldo: entradas - saidas,
    quantidade_transacoes: transacoes.length,
  };
}

function formatarDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
