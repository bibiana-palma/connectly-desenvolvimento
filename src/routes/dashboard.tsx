import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";
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
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("budgets")
      .select("status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const s = { total: 0, pago: 0, aberto: 0, producao: 0, fechado: 0 };
        data?.forEach((b: any) => {
          s.total++;
          if (b.status === "pago") s.pago++;
          else if (b.status === "em_aberto") s.aberto++;
          else if (b.status === "producao") s.producao++;
          else if (b.status === "fechado_pagamento") s.fechado++;
        });
        setStats(s);
      });
  }, [user]);

  const chartData = [
    { name: "Pagos", value: stats.pago || 1 },
    { name: "Em aberto", value: stats.aberto || 1 },
    { name: "Produção", value: stats.producao || 1 },
    { name: "Fechado", value: stats.fechado || 1 },
  ];
  const COLORS = ["#1e3a8a", "#3b82f6", "#fbbf24", "#dc2626"];

  return (
    <div>
      <h1 className="font-display italic text-3xl mb-8">Bem-Vindo ao Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-primary text-primary-foreground rounded-2xl p-6">
            <h2 className="text-center text-lg font-semibold mb-4">Ranking de Vendedores</h2>
            <div className="space-y-3">
              {[
                { stars: 1, name: "Sem dados ainda" },
                { stars: 2, name: "—" },
                { stars: 3, name: "—" },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3 border-b border-primary-foreground/20 pb-2">
                  <div className="flex">
                    {Array.from({ length: row.stars }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm">{row.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border rounded-2xl p-6">
            <h3 className="font-display italic text-primary mb-4">GRÁFICO DE ORÇAMENTOS</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-2xl p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-foreground">Orçamentos pagos</h3>
            <p className="text-sm text-muted-foreground italic mt-1">Total: {stats.pago}</p>
          </div>
          <hr />
          <div>
            <h3 className="font-semibold">Orçamentos em aberto</h3>
            <p className="text-sm text-muted-foreground italic mt-1">Total: {stats.aberto}</p>
          </div>
          <hr />
          <div>
            <h3 className="font-semibold">Orçamentos feitos</h3>
            <p className="text-sm text-muted-foreground italic mt-1">Total: {stats.total}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
