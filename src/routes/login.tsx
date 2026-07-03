import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · Altech Project" },
      { name: "description", content: "Acesse seu workspace Altech." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("member@altech.io");
  const [password, setPassword] = useState("••••••••");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") navigate({ to: "/dashboard" });
  }, [status, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Bem-vindo ao Altech Project");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Falha ao entrar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl altech-gradient altech-glow">
            <Check className="h-6 w-6 text-white" strokeWidth={3} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Altech Project</h1>
            <p className="mt-1 text-sm text-muted-foreground">Entre no seu workspace</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-panel/60 p-6 backdrop-blur">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@altech.io"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Entrar
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Use <code className="text-primary">admin@altech.io</code> para permissões completas.
          </p>
        </form>
      </div>
    </div>
  );
}
