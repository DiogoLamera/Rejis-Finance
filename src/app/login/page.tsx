"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Wallet, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !senha) return;

    setCarregando(true);
    setErro(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, senha }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErro(data.error ?? "Falha ao entrar");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado ao entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <Card>
          <CardContent className="space-y-6 p-8">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3 text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200,
                }}
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md"
              >
                <Wallet className="h-7 w-7" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold">Rejis&apos;s Finance</h1>
                <p className="text-sm text-muted-foreground">
                  Acesso restrito — entre com suas credenciais
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user">Usuário</Label>
                <Input
                  id="user"
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  required
                  autoFocus
                  disabled={carregando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={carregando}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={mostrarSenha ? "Esconder senha" : "Mostrar senha"}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {erro && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{erro}</span>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={carregando || !user || !senha}
              >
                {carregando ? (
                  <>
                    <Spinner size={16} />
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Não consegue entrar? Fale com o administrador do sistema.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
