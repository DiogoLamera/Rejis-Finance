"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/formatters";

interface CardFechamentoProps {
  titulo: string;
  subtitulo?: string;
  entradas: number;
  saidas: number;
  saldo: number;
  quantidadeTransacoes: number;
  delay?: number;
}

function ValorAnimado({ valor, className }: { valor: number; className?: string }) {
  const motionValor = useMotionValue(0);
  const formatado = useTransform(motionValor, (v) => formatBRL(v));
  const [texto, setTexto] = useState(formatBRL(0));

  useEffect(() => {
    const controls = animate(motionValor, valor, {
      duration: 1.2,
      ease: "easeOut",
    });
    const unsub = formatado.on("change", setTexto);
    return () => {
      controls.stop();
      unsub();
    };
  }, [valor, motionValor, formatado]);

  return <span className={className}>{texto}</span>;
}

export function CardFechamento({
  titulo,
  subtitulo,
  entradas,
  saidas,
  saldo,
  quantidadeTransacoes,
  delay = 0,
}: CardFechamentoProps) {
  const positivo = saldo >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="relative overflow-hidden rounded-lg shadow-md"
    >
      {/* fundo cinza inicial, depois revela a cor */}
      <motion.div
        initial={{ backgroundColor: "rgb(229 231 235)" }}
        animate={{
          backgroundColor: positivo ? "rgb(34 197 94)" : "rgb(239 68 68)",
        }}
        transition={{ duration: 0.6, delay: delay + 0.3, ease: "easeOut" }}
        className="absolute inset-0"
      />

      {/* shimmer no momento da revelação */}
      <motion.div
        initial={{ x: "-100%", opacity: 0 }}
        animate={{ x: "100%", opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.9, delay: delay + 0.3, ease: "easeOut" }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
      />

      <div className="relative p-6 text-black">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold">{titulo}</h3>
            {subtitulo && (
              <p className="text-sm font-medium opacity-80">{subtitulo}</p>
            )}
          </div>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              duration: 0.5,
              delay: delay + 0.5,
              type: "spring",
              stiffness: 200,
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10"
          >
            {positivo ? (
              <ArrowUpRight className="h-5 w-5" />
            ) : (
              <ArrowDownRight className="h-5 w-5" />
            )}
          </motion.div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
            Saldo
          </p>
          <div className="text-3xl font-bold">
            <ValorAnimado valor={saldo} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/20 pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium opacity-80">Entradas</p>
              <p className="truncate text-sm font-bold">
                <ValorAnimado valor={entradas} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium opacity-80">Saídas</p>
              <p className="truncate text-sm font-bold">
                <ValorAnimado valor={saidas} />
              </p>
            </div>
          </div>
        </div>

        <p
          className={cn(
            "mt-4 text-xs font-medium opacity-70",
            "tabular-nums",
          )}
        >
          {quantidadeTransacoes}{" "}
          {quantidadeTransacoes === 1 ? "transação" : "transações"}
        </p>
      </div>
    </motion.div>
  );
}
