import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/orcamentos/")({
  component: () => (
    <AppShell>
      <BudgetsList />
    </AppShell>
  ),
});

const STATUS_LABELS: Record<string, string> = {
  em_aberto: "EM ABERTO",
  producao: "PRODUÇÃO",
  pago: "PAGO",
  fechado_pagamento: "FECHADO/PAGAMENTO",
};

function BudgetsList() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setBudgets(data || []));
  }, [user]);

  const filtered = budgets.filter((b) =>
    (b.client_name_snapshot || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex justify-end gap-3 mb-8">
        <Link
          to="/orcamentos/novo"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> NOVO ORÇAMENTO
        </Link>
        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90">
          <Search className="w-4 h-4" /> PESQUISAR
        </button>
      </div>

      <div className="border border-primary/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg max-w-xs"
          />
          <SlidersHorizontal className="w-5 h-5 text-primary" />
        </div>

        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b font-semibold text-sm">
          <div className="col-span-2">Código</div>
          <div className="col-span-6">Cliente</div>
          <div className="col-span-4">Status</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            Nenhum orçamento cadastrado.{" "}
            <Link to="/orcamentos/novo" className="text-primary underline">
              Criar agora
            </Link>
          </div>
        ) : (
          filtered.map((b, i) => (
            <Link
              key={b.id}
              to="/orcamentos/$id"
              params={{ id: b.id }}
              className="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-0 hover:bg-accent/50 text-sm"
            >
              <div className="col-span-2 font-bold">{String(i + 1).padStart(4, "0")}</div>
              <div className="col-span-6">{b.client_name_snapshot || "—"}</div>
              <div className="col-span-4 font-semibold">{STATUS_LABELS[b.status]}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
