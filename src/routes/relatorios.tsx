import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, CartesianGrid } from "recharts";

export const Route = createFileRoute("/relatorios")({
  component: () => (
    <AppShell>
      <Reports />
    </AppShell>
  ),
});

function Reports() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("budgets").select("*").eq("user_id", user.id).then(({ data }) => setBudgets(data || []));
  }, [user]);

  const byStatus = [
    { name: "Em aberto", value: budgets.filter((b) => b.status === "em_aberto").length || 1 },
    { name: "Produção", value: budgets.filter((b) => b.status === "producao").length || 1 },
    { name: "Pago", value: budgets.filter((b) => b.status === "pago").length || 1 },
    { name: "Fechado", value: budgets.filter((b) => b.status === "fechado_pagamento").length || 1 },
  ];
  const COLORS = ["#1e3a8a", "#3b82f6", "#60a5fa", "#0f172a"];

  const monthly = Array.from({ length: 6 }, (_, i) => ({
    month: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"][i],
    valor: budgets.filter((b) => new Date(b.created_at).getMonth() === i).reduce((s, b) => s + Number(b.total), 0),
  }));

  return (
    <div>
      <h1 className="font-display italic text-3xl text-primary mb-8">Relatórios</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-primary/30 rounded-2xl p-6">
          <h3 className="text-primary font-semibold mb-4 text-center">Distribuição por status</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={100} label>
                  {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-primary/30 rounded-2xl p-6">
          <h3 className="text-primary font-semibold mb-4 text-center">Faturamento mensal (R$)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valor" fill="#1e3a8a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
