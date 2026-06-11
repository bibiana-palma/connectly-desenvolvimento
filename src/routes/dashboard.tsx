import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Plus, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: clientsData }, { data: budgetsData }] = await Promise.all([
        supabase.from("clients").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("budgets").select("*").eq("user_id", user.id).order("created_at"),
      ]);
      setClients(clientsData || []);
      setBudgets(budgetsData || []);
    })();
  }, [user]);

  const total = useMemo(
    () => budgets.reduce((sum, budget) => sum + Number(budget.total || 0), 0),
    [budgets],
  );

  const recentBudgets = budgets.slice(-5).reverse();

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="font-display italic text-2xl xl:text-3xl text-primary">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visao geral dos seus clientes e orcamentos.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/clientes/novo"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> LEAD
          </Link>
          <Link
            to="/orcamentos/novo"
            className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> ORCAMENTO
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard icon={Users} label="Clientes" value={clients.length} />
        <MetricCard icon={FileText} label="Orcamentos" value={budgets.length} />
        <MetricCard
          icon={Wallet}
          label="Total em orcamentos"
          value={total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        />
      </div>

      <div className="border border-primary/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-primary">Orcamentos recentes</h2>
          <Link to="/orcamentos" className="text-sm font-semibold text-primary hover:underline">
            Ver todos
          </Link>
        </div>

        {recentBudgets.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            Nenhum orcamento cadastrado ainda.{" "}
            <Link to="/orcamentos/novo" className="text-primary underline">
              Criar agora
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {recentBudgets.map((budget) => (
              <Link
                key={budget.id}
                to="/orcamentos/$id"
                params={{ id: budget.id }}
                className="grid grid-cols-12 gap-4 py-3 text-sm hover:bg-accent/50"
              >
                <div className="col-span-7 font-medium">
                  {budget.client_name_snapshot || "Cliente sem nome"}
                </div>
                <div className="col-span-5 text-right font-semibold">
                  {Number(budget.total || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div className="border border-primary/30 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold text-primary">{value}</div>
        </div>
      </div>
    </div>
  );
}
