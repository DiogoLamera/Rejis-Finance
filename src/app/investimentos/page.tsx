import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function InvestimentosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Investimentos</h1>
        <p className="text-muted-foreground">
          Sugestões personalizadas com base no fluxo de caixa da empresa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Análise por IA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">
            A IA analisa o saldo, a sazonalidade das entradas e os compromissos
            futuros (contas a pagar) para sugerir onde alocar o capital ocioso:
          </p>
          <ul className="ml-4 list-disc text-sm text-muted-foreground space-y-1">
            <li>Renda fixa de curto prazo (CDB, Tesouro Selic) para reserva</li>
            <li>Fundos DI para liquidez imediata</li>
            <li>LCI/LCA para retorno isento de IR</li>
            <li>Alertas quando há capital parado em conta corrente</li>
          </ul>
          <p className="text-xs text-muted-foreground pt-2">
            ⚠️ As sugestões são informativas e não substituem assessoria
            financeira profissional.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
