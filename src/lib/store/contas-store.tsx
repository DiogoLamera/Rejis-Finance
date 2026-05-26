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

export type StatusContaPagar = "pendente" | "paga" | "atrasada" | "cancelada";

export interface Conta {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: Date;
  data_pagamento: Date | null;
  categoria: string;
  status: StatusContaPagar;
  recorrente: boolean;
  documentoPath: string | null;
  criadoEm: string;
}

interface ContasContextValor {
  contas: Conta[];
  carregando: boolean;
  adicionar: (
    c: Omit<
      Conta,
      "id" | "criadoEm" | "data_pagamento" | "status"
    > & {
      status?: StatusContaPagar;
    },
  ) => void;
  atualizarStatus: (id: string, status: StatusContaPagar) => void;
  remover: (id: string) => void;
  recarregar: () => Promise<void>;
}

const ContasContext = createContext<ContasContextValor | null>(null);

interface ContaRow {
  id: string;
  descricao: string;
  valor: string | number;
  data_vencimento: string; // YYYY-MM-DD
  data_pagamento: string | null;
  categoria: string;
  status: StatusContaPagar;
  recorrente: boolean;
  documento_url: string | null;
  created_at: string;
}

function parseDataISO(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function mapearDoBanco(row: ContaRow): Conta {
  return {
    id: row.id,
    descricao: row.descricao,
    valor:
      typeof row.valor === "string" ? parseFloat(row.valor) : row.valor,
    data_vencimento: parseDataISO(row.data_vencimento),
    data_pagamento: row.data_pagamento ? parseDataISO(row.data_pagamento) : null,
    categoria: row.categoria,
    status: row.status,
    recorrente: row.recorrente,
    documentoPath: row.documento_url ?? null,
    criadoEm: row.created_at,
  };
}

function formatarDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function ContasProvider({ children }: { children: ReactNode }) {
  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      const res = await fetch("/api/contas", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha ao carregar");
      const lista = (json.contas ?? []) as ContaRow[];
      setContas(lista.map(mapearDoBanco));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar contas a pagar", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const adicionar = useCallback<ContasContextValor["adicionar"]>((input) => {
    const tempId = `tmp_${crypto.randomUUID()}`;
    const otimista: Conta = {
      id: tempId,
      descricao: input.descricao,
      valor: input.valor,
      data_vencimento: input.data_vencimento,
      data_pagamento: null,
      categoria: input.categoria,
      status: input.status ?? "pendente",
      recorrente: input.recorrente,
      documentoPath: input.documentoPath ?? null,
      criadoEm: new Date().toISOString(),
    };
    setContas((curr) => [...curr, otimista]);

    fetch("/api/contas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        descricao: input.descricao,
        valor: input.valor,
        data_vencimento: formatarDataISO(input.data_vencimento),
        categoria: input.categoria,
        recorrente: input.recorrente,
        documento_url: input.documentoPath ?? null,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Falha");
        setContas((curr) =>
          curr.map((c) =>
            c.id === tempId ? mapearDoBanco(json.conta) : c,
          ),
        );
      })
      .catch((e) => {
        setContas((curr) => curr.filter((c) => c.id !== tempId));
        toast.error("Erro ao salvar conta", {
          description: e instanceof Error ? e.message : undefined,
        });
      });
  }, []);

  const atualizarStatus = useCallback(
    (id: string, status: StatusContaPagar) => {
      const anterior = contas;
      setContas((curr) =>
        curr.map((c) => (c.id === id ? { ...c, status } : c)),
      );
      fetch(`/api/contas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          data_pagamento:
            status === "paga" ? formatarDataISO(new Date()) : null,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const json = await res.json();
            throw new Error(json.error ?? "Falha");
          }
        })
        .catch((e) => {
          setContas(anterior);
          toast.error("Erro ao atualizar status da conta", {
            description: e instanceof Error ? e.message : undefined,
          });
        });
    },
    [contas],
  );

  const remover = useCallback(
    (id: string) => {
      const anterior = contas;
      setContas((curr) => curr.filter((c) => c.id !== id));
      fetch(`/api/contas/${id}`, { method: "DELETE" })
        .then(async (res) => {
          if (!res.ok) {
            const json = await res.json();
            throw new Error(json.error ?? "Falha");
          }
        })
        .catch((e) => {
          setContas(anterior);
          toast.error("Erro ao remover conta", {
            description: e instanceof Error ? e.message : undefined,
          });
        });
    },
    [contas],
  );

  const valor = useMemo(
    () => ({
      contas,
      carregando,
      adicionar,
      atualizarStatus,
      remover,
      recarregar,
    }),
    [contas, carregando, adicionar, atualizarStatus, remover, recarregar],
  );

  return (
    <ContasContext.Provider value={valor}>{children}</ContasContext.Provider>
  );
}

export function useContas() {
  const ctx = useContext(ContasContext);
  if (!ctx) throw new Error("useContas deve ser usado dentro de ContasProvider");
  return ctx;
}
