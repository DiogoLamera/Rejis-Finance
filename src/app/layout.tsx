import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/sidebar";
import { PageTransition } from "@/components/page-transition";
import { ThemeProvider } from "@/components/theme-provider";
import { TransacoesProvider } from "@/lib/store/transacoes-store";
import { ContasProvider } from "@/lib/store/contas-store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rejis's Finance — Controle Financeiro",
  description:
    "Sistema de controle financeiro: entradas, saídas, contas a pagar, fechamentos diários e mensais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TransacoesProvider>
            <ContasProvider>
              <Sidebar />
              <main className="ml-64 min-h-screen overflow-x-hidden">
                <div className="container mx-auto px-6 py-8">
                  <PageTransition>{children}</PageTransition>
                </div>
              </main>
              <Toaster position="top-right" richColors />
            </ContasProvider>
          </TransacoesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
