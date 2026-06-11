import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";

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

const DEFAULT_STATUS_COLOR = "#6366f1";

type CustomStatus = { id: string; name: string; color: string };

function BudgetsList() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [customStatuses, setCustomStatuses] = useState<CustomStatus[]>([]);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: bs }, { data: assigns }, { data: statuses }] = await Promise.all([
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("budget_status_assignments")
          .select("budget_id, status_id")
          .eq("user_id", user.id),
        supabase
          .from("budget_statuses")
          .select("id, name, color")
          .eq("user_id", user.id),
      ]);
      setBudgets(bs || []);
      setCustomStatuses(statuses || []);
      const map: Record<string, string[]> = {};
      (assigns || []).forEach((a: any) => {
        (map[a.budget_id] ||= []).push(a.status_id);
      });
      setAssignments(map);
    })();
  }, [user]);

  const statusById = useMemo(
    () => Object.fromEntries(customStatuses.map((s) => [s.id, s])),
    [customStatuses],
  );

  const filtered = budgets.filter((b) => {
    const matchesSearch = (b.client_name_snapshot || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedStatusFilters.length === 0) return true;
    const ids = assignments[b.id] || (b.custom_status_id ? [b.custom_status_id] : []);
    return selectedStatusFilters.some((f) => ids.includes(f) || f === b.status);
  });

  const toggleFilter = (value: string) => {
    setSelectedStatusFilters((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-end gap-3 mb-8">
        <Link
          to="/orcamentos/novo"
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90 justify-center"
        >
          <Plus className="w-4 h-4" /> NOVO ORÇAMENTO
        </Link>
        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90 justify-center">
          <Search className="w-4 h-4" /> PESQUISAR
        </button>
      </div>

      <div className="border border-primary/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg max-w-xs flex-1"
          />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters || selectedStatusFilters.length > 0
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-accent"
            }`}
            aria-label="Filtros"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="mb-4 p-4 border border-border rounded-lg bg-accent/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Filtrar por status</span>
              {selectedStatusFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStatusFilters([])}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <X className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {customStatuses.map((s) => {
                const active = selectedStatusFilters.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleFilter(s.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all"
                    style={{
                      backgroundColor: active ? s.color : "transparent",
                      color: active ? "#fff" : s.color,
                      borderColor: s.color,
                    }}
                  >
                    {s.name}
                  </button>
                );
              })}
              {customStatuses.length === 0 && (
                <span className="text-xs text-muted-foreground">
                  Nenhum status personalizado cadastrado.
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b font-semibold text-sm">
          <div className="col-span-2">Código</div>
          <div className="col-span-5">Cliente</div>
          <div className="col-span-5">Status</div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            Nenhum orçamento encontrado.{" "}
            <Link to="/orcamentos/novo" className="text-primary underline">
              Criar agora
            </Link>
          </div>
        ) : (
          filtered.map((b, i) => {
            const ids = assignments[b.id] || (b.custom_status_id ? [b.custom_status_id] : []);
            const tags = ids.map((id) => statusById[id]).filter(Boolean) as CustomStatus[];
            return (
              <Link
                key={b.id}
                to="/orcamentos/$id"
                params={{ id: b.id }}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-0 hover:bg-accent/50 text-sm items-center"
              >
                <div className="col-span-2 font-bold">{String(i + 1).padStart(4, "0")}</div>
                <div className="col-span-5">{b.client_name_snapshot || "—"}</div>
                <div className="col-span-5 flex flex-wrap gap-1">
                  {tags.length > 0 ? (
                    tags.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: s.color || DEFAULT_STATUS_COLOR }}
                      >
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <span className="font-semibold text-xs">{STATUS_LABELS[b.status]}</span>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
