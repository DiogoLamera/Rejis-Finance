"use client";

import { useEffect, useState, type ReactNode } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/formatters";

interface CardResumoProps {
  titulo: string;
  valor: number;
  icone: ReactNode;
  variante?: "default" | "success" | "destructive";
  descricao?: string;
  delay?: number;
  formato?: "moeda" | "numero";
}

function ValorAnimado({
  valor,
  formato = "moeda",
}: {
  valor: number;
  formato?: "moeda" | "numero";
}) {
  const motionValor = useMotionValue(0);
  const rounded = useTransform(motionValor, (v) =>
    formato === "moeda" ? formatBRL(v) : Math.round(v).toString(),
  );
  const [texto, setTexto] = useState(() =>
    formato === "moeda" ? formatBRL(0) : "0",
  );

  useEffect(() => {
    const controls = animate(motionValor, valor, {
      duration: 1,
      ease: "easeOut",
    });
    const unsub = rounded.on("change", setTexto);
    return () => {
      controls.stop();
      unsub();
    };
  }, [valor, motionValor, rounded]);

  return <span>{texto}</span>;
}

export function CardResumo({
  titulo,
  valor,
  icone,
  variante = "default",
  descricao,
  delay = 0,
  formato = "moeda",
}: CardResumoProps) {
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
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={cn(
              variante === "success" && "text-success",
              variante === "destructive" && "text-destructive",
              variante === "default" && "text-muted-foreground",
            )}
          >
            {icone}
          </motion.div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              variante === "success" && "text-success",
              variante === "destructive" && "text-destructive",
            )}
          >
            <ValorAnimado valor={valor} formato={formato} />
          </div>
          {descricao && (
            <p className="text-xs text-muted-foreground mt-1">{descricao}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
