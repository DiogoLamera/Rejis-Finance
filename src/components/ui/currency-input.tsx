"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type ComponentProps,
} from "react";
import { Input } from "@/components/ui/input";

const MAX_CENTAVOS = 9_999_999_999; // R$ 99.999.999,99

function formatCentavos(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

interface CurrencyInputProps
  extends Omit<ComponentProps<"input">, "value" | "onChange" | "type"> {
  /** Valor decimal como string, ex: "150.50" */
  value: string;
  /** Callback com o novo valor decimal como string */
  onValueChange: (value: string) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput({ value, onValueChange, ...props }, ref) {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const centavos = Math.round(parseFloat(value || "0") * 100);
    const display = formatCentavos(Number.isFinite(centavos) ? centavos : 0);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const digits = e.target.value.replace(/\D/g, "");
      const novo = parseInt(digits || "0", 10);
      if (!Number.isFinite(novo) || novo > MAX_CENTAVOS) return;
      onValueChange((novo / 100).toFixed(2));
    }

    function moverCursorParaFinal() {
      if (!innerRef.current) return;
      const len = innerRef.current.value.length;
      innerRef.current.setSelectionRange(len, len);
    }

    // Mantém o cursor sempre no final enquanto o input estiver focado
    useEffect(() => {
      if (
        innerRef.current &&
        document.activeElement === innerRef.current
      ) {
        moverCursorParaFinal();
      }
    });

    return (
      <Input
        ref={innerRef}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onFocus={() => requestAnimationFrame(moverCursorParaFinal)}
        onClick={moverCursorParaFinal}
        {...props}
      />
    );
  },
);
