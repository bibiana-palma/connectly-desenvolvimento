import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  Box,
  FileText,
  Plus,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
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

const FALLBACK_STATUSES = [
  { key: "pago", label: "Pagos", color: "#1f3f96" },
  { key: "em_aberto", label: "Em aberto", color: "#3b82f6" },
  { key: "producao", label: "Em produção", color: "#f5b400" },
  { key: "fechado_pagamento", label: "Fechado p/ pagamento", color: "#e30613" },
];

function Dashboard() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [
        { data: clientsData },
        { data: budgetsData },
        { data: productsData },
        { data: statusesData },
        { data: assignmentsData },
      ] = await Promise.all([
        supabase.from("clients").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("budgets").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("products").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("budget_statuses").select("*").eq("user_id", user.id).order("sort_order").order("created_at"),
        supabase.from("budget_status_assignments").select("*").eq("user_id", user.id),
      ]);
      setClients(clientsData || []);
      setBudgets(budgetsData || []);
      setProducts(productsData || []);
      setStatuses(statusesData || []);
      setAssignments(assignmentsData || []);
    })();
  }, [user]);

  const statusById = useMemo(
    () => Object.fromEntries(statuses.map((status) => [status.id, status])),
    [statuses],
  );

  const summaryStatuses = useMemo(
    () =>
      statuses.length
        ? statuses.map((status) => ({
            key: status.id,
            label: status.name,
            color: status.color || "#3b82f6",
            normalized: normalizeStatus(status.name),
          }))
        : FALLBACK_STATUSES.map((status) => ({
            ...status,
            normalized: normalizeStatus(status.label),
          })),
    [statuses],
  );

  const primaryStatusByBudgetId = useMemo(() => {
    const map: Record<string, string> = {};
    assignments.forEach((assignment) => {
      if (!map[assignment.budget_id]) {
        map[assignment.budget_id] = assignment.status_id;
      }
    });
    return map;
  }, [assignments]);

  const budgetsWithStatus = useMemo(
    () =>
      budgets.map((budget) => {
        const assignedStatus = statusById[primaryStatusByBudgetId[budget.id] || budget.custom_status_id];
        const legacyStatus = normalizeStatus(budget.status);
        const matchingStatus = summaryStatuses.find((status) => status.normalized === legacyStatus);
        return {
          ...budget,
          dashboardStatusKey: assignedStatus?.id || matchingStatus?.key || legacyStatus,
          dashboardStatusLabel: assignedStatus?.name || matchingStatus?.label || statusLabelFromKey(budget.status),
        };
      }),
    [budgets, primaryStatusByBudgetId, statusById, summaryStatuses],
  );

  const counts = useMemo(() => {
    return summaryStatuses.reduce<Record<string, number>>((acc, status) => {
      acc[status.key] = budgetsWithStatus.filter((budget) => budget.dashboardStatusKey === status.key).length;
      return acc;
    }, {});
  }, [budgetsWithStatus, summaryStatuses]);

  const paidRevenue = useMemo(
    () =>
      budgetsWithStatus
        .filter((budget) => normalizeStatus(budget.dashboardStatusLabel) === "pago")
        .reduce((sum, budget) => sum + Number(budget.total || 0), 0),
    [budgetsWithStatus],
  );

  const chartData = summaryStatuses.map((status) => ({
    name: status.label,
    value: counts[status.key] || 0,
    color: status.color,
  })).filter((item) => item.value > 0);

  const recentBudgets = budgetsWithStatus.slice(-5).reverse();

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="font-display italic text-3xl xl:text-4xl text-primary">
          Bem-vindo ao Dashboard
        </h1>
        <Link
          to="/orcamentos/novo"
          className="bg-primary text-primary-foreground px-6 py-3 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Novo orçamento
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <MetricCard
          active
          icon={TrendingUp}
          label="Receita (pagos)"
          value={paidRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        />
        <MetricCard icon={FileText} label="Orçamentos" value={budgets.length} />
        <MetricCard icon={Users} label="Clientes" value={clients.length} />
        <MetricCard icon={Box} label="Produtos" value={products.length} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 mb-6">
        <section className="border border-primary/20 rounded-2xl p-6 min-h-[360px]">
          <h2 className="font-display italic text-xl text-primary mb-4">
            Distribuição dos Orçamentos
          </h2>
          {chartData.length ? (
            <div className="h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    outerRadius={100}
                    label={({ value }) => value}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[290px] flex items-center justify-center text-muted-foreground">
              Nenhum orçamento cadastrado ainda.
            </div>
          )}
        </section>

        <section className="border border-primary/20 rounded-2xl p-6 min-h-[360px]">
          <h2 className="font-display italic text-xl text-primary mb-4">Resumo</h2>
          <div className="space-y-5">
            {summaryStatuses.map((status) => (
              <div key={status.key} className="flex items-center gap-3 text-sm">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: status.color }}
                />
                <span className="flex-1">{status.label}</span>
                <span className="font-semibold">{counts[status.key] || 0}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display italic text-xl text-primary">Orçamentos recentes</h2>
          <Link
            to="/orcamentos"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentBudgets.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            Nenhum orçamento cadastrado ainda.{" "}
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
                className="flex items-center justify-between gap-4 py-4 text-sm hover:bg-accent/50"
              >
                <div>
                  <div className="font-semibold">
                    {budget.client_name_snapshot || "Cliente sem nome"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(budget.created_at)} · {budget.dashboardStatusLabel}
                  </div>
                </div>
                <div className="font-bold">
                  {Number(budget.total || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  active,
  icon: Icon,
  label,
  value,
}: {
  active?: boolean;
  icon: typeof Users;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className={`rounded-2xl p-5 border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background border-primary/20"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold mb-3">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function normalizeStatus(value?: string) {
  const normalized = (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("pago")) return "pago";
  if (normalized.includes("producao")) return "producao";
  if (normalized.includes("fechado")) return "fechado_pagamento";
  return "em_aberto";
}

function statusLabelFromKey(key?: string) {
  return FALLBACK_STATUSES.find((status) => status.key === key)?.label || "Em aberto";
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("pt-BR");
}
