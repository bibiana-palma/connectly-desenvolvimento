import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone } from "@/lib/phone";
import { UserCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setConfirmationEmail("");
        toast.success("Bem-vindo de volta!");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { name, company, phone },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmationEmail(email);
          toast.success("Conta criada! Confirme seu email para entrar.");
          setMode("login");
          return;
        }
        toast.success("Conta criada! Você já pode entrar.");
        setMode("login");
      }
    } catch (err: any) {
      if (isEmailNotConfirmedError(err)) {
        setConfirmationEmail(email);
        toast.error("Email ainda nao confirmado. Verifique sua caixa de entrada.");
      } else if (isEmailRateLimitError(err)) {
        setConfirmationEmail(email);
        toast.error("Limite de emails atingido. Aguarde um pouco ou desative a confirmacao por email no Supabase.");
      } else {
        toast.error(err.message || "Erro ao processar");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = confirmationEmail || email;
    if (!targetEmail) {
      toast.error("Informe o email para reenviar a confirmacao.");
      return;
    }

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
      toast.success("Email de confirmacao reenviado.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao reenviar confirmacao");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-5xl text-primary mb-10">Connectly</h1>

        <div className="border border-border rounded-2xl shadow-lg p-8 bg-card">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 rounded-full border-2 border-foreground/80 flex items-center justify-center">
              <UserCircle2 className="w-9 h-9 text-foreground/80" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <input
                  type="text"
                  placeholder="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Empresa / negócio"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full px-4 py-3 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="tel"
                  placeholder="Telefone"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={16}
                  className="w-full px-4 py-3 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </>
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-primary/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm font-semibold underline text-foreground/80 hover:text-foreground"
                  onClick={() => toast.info("Funcionalidade em breve")}
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            {mode === "login" && confirmationEmail && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                <p className="mb-2">
                  Confirme o email <strong>{confirmationEmail}</strong> antes de entrar.
                </p>
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={resendLoading}
                  className="font-semibold text-primary underline disabled:opacity-60"
                >
                  {resendLoading ? "Reenviando..." : "Reenviar email de confirmacao"}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-full hover:bg-primary/90 transition disabled:opacity-60"
            >
              {loading ? "..." : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "login"
                ? "Não tem conta? Cadastre-se"
                : "Já tem conta? Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function isEmailNotConfirmedError(err: any) {
  return String(err?.message ?? err)
    .toLowerCase()
    .includes("email not confirmed");
}

function isEmailRateLimitError(err: any) {
  const message = String(err?.message ?? err).toLowerCase();
  return message.includes("email rate limit") || message.includes("rate limit exceeded");
}
