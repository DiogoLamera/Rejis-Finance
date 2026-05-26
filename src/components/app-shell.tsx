"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { PageTransition } from "@/components/page-transition";

const ROTAS_PUBLICAS = ["/login"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isRotaPublica = ROTAS_PUBLICAS.includes(pathname);

  if (isRotaPublica) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <main className="ml-64 min-h-screen overflow-x-hidden">
        <div className="container mx-auto px-6 py-8">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </>
  );
}
