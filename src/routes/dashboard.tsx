import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { FileText, Users, Package, TrendingUp, Plus, ArrowRight } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pago: 0,
    aberto: 0,
    producao: 0,
    fechado: 0,
    revenue: 0,
    clients: 0,
    products: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      supabase
        .from("budgets")
        .select("status, total, client_name_snapshot, created_at, id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]).then(([budgetsRes, clientsRes, productsRes]) => {
      const s = { total: 0, pago: 0, aberto: 0, producao: 0, fechado: 0, revenue: 0, clients: 0, products: 0 };
      budgetsRes.data?.forEach((b: any) => {
        s.total++;
        if (b.status === "pago") {
          s.pago++;
          s.revenue += Number(b.total) || 0;
        } else if (b.status === "em_aberto") s.aberto++;
        else if (b.status === "producao") s.producao++;
        else if (b.status === "fechado_pagamento") s.fechado++;
      });
      s.clients = clientsRes.count || 0;
      s.products = productsRes.count || 0;
      setStats(s);
      setRecent((budgetsRes.data || []).slice(0, 5));
    });
  }, [user]);

  const chartData = [
    { name: "Pagos", value: stats.pago },
    { name: "Em aberto", value: stats.aberto },
    { name: "Produção", value: stats.producao },
    { name: "Fechado", value: stats.fechado },
  ].filter((d) => d.value > 0);

  const displayChart = chartData.length > 0 ? chartData : [{ name: "Sem dados", value: 1 }];
  const COLORS = ["#1e3a8a", "#3b82f6", "#fbbf24", "#dc2626"];

  const statusLabel = (s: string) =>
    ({ pago: "Pago", em_aberto: "Em aberto", producao: "Produção", fechado_pagamento: "Fechado" } as any)[s] || s;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display italic text-3xl">Bem-Vindo ao Dashboard</h1>
        <Link
          to="/orcamentos/novo"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" />
          Novo orçamento
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={TrendingUp} label="Receita (pagos)" value={formatCurrency(stats.revenue)} accent />
        <KpiCard icon={FileText} label="Orçamentos" value={String(stats.total)} />
        <KpiCard icon={Users} label="Clientes" value={String(stats.clients)} />
        <KpiCard icon={Package} label="Produtos" value={String(stats.products)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 border border-border rounded-2xl p-6 bg-card">
          <h3 className="font-display italic text-primary mb-4">Distribuição dos Orçamentos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={displayChart} dataKey="value" nameKey="name" outerRadius={100} label>
                  {displayChart.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status summary */}
        <div className="border border-border rounded-2xl p-6 bg-card space-y-4">
          <h3 className="font-display italic text-primary mb-2">Resumo</h3>
          <StatusRow label="Pagos" value={stats.pago} color="bg-blue-900" />
          <StatusRow label="Em aberto" value={stats.aberto} color="bg-blue-500" />
          <StatusRow label="Em produção" value={stats.producao} color="bg-amber-400" />
          <StatusRow label="Fechado p/ pagamento" value={stats.fechado} color="bg-red-600" />
        </div>
      </div>

      {/* Recent budgets */}
      <div className="border border-border rounded-2xl p-6 bg-card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display italic text-primary">Orçamentos recentes</h3>
          <Link to="/orcamentos" className="text-sm text-primary font-semibold inline-flex items-center gap-1 hover:underline">
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Nenhum orçamento ainda.{" "}
            <Link to="/orcamentos/novo" className="text-primary font-semibold underline">
              Criar o primeiro
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((b) => (
              <Link
                key={b.id}
                to="/orcamentos/$id"
                params={{ id: b.id }}
                className="flex items-center justify-between py-3 hover:bg-muted/40 px-2 rounded-md transition"
              >
                <div>
                  <div className="font-medium text-sm">{b.client_name_snapshot || "Cliente"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString("pt-BR")} · {statusLabel(b.status)}
                  </div>
                </div>
                <div className="font-semibold text-sm">{formatCurrency(Number(b.total) || 0)}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        accent ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-medium opacity-80">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}

function StatusRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${color}`} />
        <span>{label}</span>
      </div>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
