"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { PageTransition } from "@/components/page-transition";
import { TransacoesProvider } from "@/lib/store/transacoes-store";
import { ContasProvider } from "@/lib/store/contas-store";

const ROTAS_PUBLICAS = ["/login"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRotaPublica = ROTAS_PUBLICAS.includes(pathname);

  // Em rotas públicas (login) não montamos os Providers, pois eles tentam
  // buscar dados de APIs protegidas e gerariam toasts de erro 401.
  if (isRotaPublica) {
    return <>{children}</>;
  }

  return (
    <TransacoesProvider>
      <ContasProvider>
        <Sidebar />
        <main className="ml-64 min-h-screen overflow-x-hidden">
          <div className="container mx-auto px-6 py-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </ContasProvider>
    </TransacoesProvider>
  );
}
