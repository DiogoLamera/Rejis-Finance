"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileText, Download, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface BotaoDocumentoProps {
  path: string | null;
  variante?: "icone" | "completo";
  label?: string;
  className?: string;
  download?: boolean;
}

export function BotaoDocumento({
  path,
  variante = "icone",
  label,
  className,
  download = false,
}: BotaoDocumentoProps) {
  const [carregando, setCarregando] = useState(false);

  if (!path) return null;

  async function abrir(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCarregando(true);
    try {
      const url = `/api/upload/url?path=${encodeURIComponent(path!)}${download ? "&download=1" : ""}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Falha");
      window.open(json.url, "_blank");
    } catch (e) {
      toast.error("Erro ao abrir documento", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setCarregando(false);
    }
  }

  if (variante === "icone") {
    return (
      <button
        type="button"
        onClick={abrir}
        disabled={carregando}
        title={download ? "Baixar documento" : "Visualizar documento"}
        className={cn(
          "shrink-0 text-primary transition-opacity hover:opacity-70 disabled:opacity-50",
          className,
        )}
      >
        <FileText className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={abrir}
      disabled={carregando}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50",
        className,
      )}
    >
      {download ? (
        <Download className="h-3.5 w-3.5" />
      ) : (
        <ExternalLink className="h-3.5 w-3.5" />
      )}
      {carregando ? "Abrindo..." : label ?? (download ? "Baixar" : "Visualizar")}
    </button>
  );
}
