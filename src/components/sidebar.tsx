"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  LineChart,
  FileText,
  Wallet,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/entradas", label: "Entradas", icon: TrendingUp },
  { href: "/saidas", label: "Saídas", icon: TrendingDown },
  { href: "/contas-a-pagar", label: "Contas a Pagar", icon: CalendarClock },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/investimentos", label: "Investimentos", icon: LineChart },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("Falha ao sair");
      router.replace("/login");
      router.refresh();
    } catch (e) {
      toast.error("Erro ao sair", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

  return (
    <motion.aside
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/10 bg-primary"
    >
      <Link
        href="/"
        className="flex h-16 items-center gap-2 border-b border-white/10 px-6 transition-colors hover:bg-white/10"
        aria-label="Ir para o dashboard"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ rotate: 12, scale: 1.05 }}
          transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-primary"
        >
          <Wallet className="h-4 w-4" />
        </motion.div>
        <h1 className="text-xl font-bold text-white">Rejis&apos;s Finance</h1>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const ativo =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <motion.div
              key={item.href}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  ativo
                    ? "text-primary"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {ativo && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-md bg-white"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4 transition-transform group-hover:scale-110" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-white/10 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-white/60">Tema</span>
          <ThemeToggle />
        </div>
      </div>
    </motion.aside>
  );
}
