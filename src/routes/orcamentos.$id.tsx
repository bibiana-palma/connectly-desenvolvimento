import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

export const Route = createFileRoute("/orcamentos/$id")({
  component: () => (
    <AppShell>
      <BudgetDetail />
    </AppShell>
  ),
});

function BudgetDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("budgets")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setBudget(data));
    supabase
      .from("budget_items")
      .select("*")
      .eq("budget_id", id)
      .then(({ data }) => setItems(data || []));
  }, [id, user]);

  if (!budget) return <div className="text-muted-foreground">Carregando...</div>;

  const handleStatus = async (status: "em_aberto" | "producao" | "pago" | "fechado_pagamento") => {
    const { error } = await supabase.from("budgets").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Status atualizado");
      setBudget({ ...budget, status });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este orçamento?")) return;
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Excluído");
      navigate({ to: "/orcamentos" });
    }
  };

  return (
    <div>
      <button onClick={() => navigate({ to: "/orcamentos" })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <div className="flex items-start justify-between mb-8">
        <h1 className="font-display italic text-3xl text-primary">Orçamento #{id.slice(0, 8)}</h1>
        <div className="text-sm space-y-1">
          <div><span className="font-bold text-primary">Vendedor:</span> {budget.seller_name}</div>
          <div><span className="font-bold text-primary">Cliente:</span> {budget.client_name_snapshot}</div>
        </div>
      </div>

      <div className="border-2 border-primary rounded-xl overflow-hidden mb-8">
        <div className="grid grid-cols-12 bg-white border-b-2 border-primary">
          <div className="col-span-7 px-4 py-3 font-bold text-primary text-center border-r-2 border-primary">Produtos</div>
          <div className="col-span-2 px-4 py-3 font-bold text-primary text-center border-r-2 border-primary">Qtd</div>
          <div className="col-span-3 px-4 py-3 font-bold text-primary text-center">Valor</div>
        </div>
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-12 border-b border-primary/30 last:border-0">
            <div className="col-span-7 px-4 py-2 border-r border-primary/30">{it.product_name}</div>
            <div className="col-span-2 px-4 py-2 border-r border-primary/30 text-center">{it.quantity}</div>
            <div className="col-span-3 px-4 py-2 text-right">R$ {Number(it.unit_price).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="border-2 border-primary rounded-xl overflow-hidden max-w-2xl mb-6">
        <Row label="Valor dos produtos:" value={Number(budget.products_total).toFixed(2)} />
        <Row label="Frete:" value={Number(budget.freight).toFixed(2)} />
        <Row label="VALOR TOTAL:" value={Number(budget.total).toFixed(2)} bold />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <label className="font-bold text-primary">Status:</label>
        <select
          value={budget.status}
          onChange={(e) => handleStatus(e.target.value)}
          className="border border-primary/30 rounded-md px-3 py-2"
        >
          <option value="em_aberto">Em aberto</option>
          <option value="producao">Produção</option>
          <option value="pago">Pago</option>
          <option value="fechado_pagamento">Fechado / pagamento</option>
        </select>
      </div>

      {budget.notes && (
        <div className="border border-primary/30 rounded-lg p-4 mb-6">
          <div className="font-bold text-primary text-sm mb-1">Observações</div>
          <div className="text-sm whitespace-pre-wrap">{budget.notes}</div>
        </div>
      )}

      <button
        onClick={handleDelete}
        className="px-4 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" /> Excluir orçamento
      </button>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="grid grid-cols-3 border-b-2 border-primary last:border-0">
      <div className={`col-span-2 px-4 py-3 border-r-2 border-primary text-primary ${bold ? "font-bold" : "font-semibold"}`}>
        {label}
      </div>
      <div className={`px-4 py-3 text-right ${bold ? "font-bold" : ""}`}>R$ {value}</div>
    </div>
  );
}
