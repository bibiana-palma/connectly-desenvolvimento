import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Printer, Trash2 } from "lucide-react";

export const Route = createFileRoute("/orcamentos/$id")({
  component: () => (
    <AppShell>
      <BudgetDetail />
    </AppShell>
  ),
});

interface Item {
  id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

function BudgetDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>("");
  const [seller, setSeller] = useState("");
  const [freight, setFreight] = useState(0);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"em_aberto" | "producao" | "pago" | "fechado_pagamento">("em_aberto");
  const [customStatuses, setCustomStatuses] = useState<{ id: string; name: string; color: string }[]>([]);
  const [customStatusId, setCustomStatusId] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [budgetNumber, setBudgetNumber] = useState<number | null>(null);
  const [clientNameSnapshot, setClientNameSnapshot] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: budget }, { data: itemsData }, { data: clientsData }, { data: statusesData }] = await Promise.all([
        supabase.from("budgets").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
        supabase.from("budget_items").select("*").eq("budget_id", id).order("created_at", { ascending: true }),
        supabase.from("clients").select("id,name").eq("user_id", user.id),
        supabase.from("budget_statuses").select("id,name,color").eq("user_id", user.id).order("sort_order").order("created_at"),
      ]);
      if (!budget) {
        setLoaded(true);
        return;
      }
      setClientId(budget.client_id || "");
      setClientNameSnapshot(budget.client_name_snapshot || "");
      setBudgetNumber(budget.budget_number ?? null);
      setSeller(budget.seller_name || "");
      setFreight(Number(budget.freight) || 0);
      setNotes(budget.notes || "");
      setStatus(budget.status);
      setCustomStatusId(budget.custom_status_id || "");
      setCustomStatuses(statusesData || []);
      setItems(
        (itemsData || []).map((it: any) => ({
          id: it.id,
          product_name: it.product_name,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
        })),
      );
      setClients(clientsData || []);
      setLoaded(true);
    })();
  }, [id, user]);

  if (!loaded) return <div className="text-muted-foreground">Carregando...</div>;

  const productsTotal = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
  const total = productsTotal + Number(freight);

  const updateItem = (i: number, patch: Partial<Item>) => {
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const clientName = clients.find((c) => c.id === clientId)?.name || "";

    const { error: e1 } = await supabase
      .from("budgets")
      .update({
        client_id: clientId || null,
        client_name_snapshot: clientName,
        seller_name: seller,
        freight,
        products_total: productsTotal,
        total,
        status,
        custom_status_id: customStatusId || null,
        notes,
      })
      .eq("id", id);

    if (e1) {
      toast.error(e1.message);
      setSaving(false);
      return;
    }

    // Replace items: delete existing then insert current
    const { error: eDel } = await supabase.from("budget_items").delete().eq("budget_id", id);
    if (eDel) {
      toast.error(eDel.message);
      setSaving(false);
      return;
    }

    const validItems = items.filter((it) => it.product_name.trim());
    if (validItems.length) {
      const { error: e2 } = await supabase.from("budget_items").insert(
        validItems.map((it) => ({
          budget_id: id,
          user_id: user.id,
          product_name: it.product_name,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      );
      if (e2) {
        toast.error(e2.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast.success("Orçamento atualizado!");
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
      <div className="flex items-center justify-between mb-4 print:hidden">
        <button
          onClick={() => navigate({ to: "/orcamentos" })}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Printer className="w-4 h-4" /> Imprimir Orçamento
        </button>
      </div>

      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <h1 className="font-display italic text-3xl text-primary">
          {(clients.find((c) => c.id === clientId)?.name || clientNameSnapshot || "Orçamento")}
          {budgetNumber != null && <span className="text-foreground/70"> #{String(budgetNumber).padStart(3, "0")}</span>}
        </h1>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <label className="font-bold text-primary w-20">Vendedor:</label>
            <input
              value={seller}
              onChange={(e) => setSeller(e.target.value)}
              className="bg-primary text-primary-foreground rounded-md px-3 py-1 w-56"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="font-bold text-primary w-20">Cliente:</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="bg-primary text-primary-foreground rounded-md px-3 py-1 w-56"
            >
              <option value="">Selecione...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-foreground">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="border-2 border-primary rounded-xl overflow-hidden mb-3">
        <div className="grid grid-cols-12 bg-white border-b-2 border-primary">
          <div className="col-span-7 px-4 py-3 font-bold text-primary text-center border-r-2 border-primary">Produtos:</div>
          <div className="col-span-2 px-4 py-3 font-bold text-primary text-center border-r-2 border-primary">Quantidade:</div>
          <div className="col-span-3 px-4 py-3 font-bold text-primary text-center">Valor:</div>
        </div>
        {items.length === 0 && (
          <div className="px-4 py-6 text-center text-muted-foreground text-sm">Nenhum item. Adicione abaixo.</div>
        )}
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 border-b border-primary/40 last:border-0">
            <input
              value={it.product_name}
              onChange={(e) => updateItem(i, { product_name: e.target.value })}
              className="col-span-7 px-4 py-3 outline-none border-r border-primary/40"
              placeholder="Descrição do produto"
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={it.quantity}
              onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
              className="col-span-2 px-4 py-3 outline-none border-r border-primary/40 text-center"
            />
            <div className="col-span-3 flex">
              <input
                type="number"
                min={0}
                step="0.01"
                value={it.unit_price}
                onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })}
                className="flex-1 px-4 py-3 outline-none text-right"
              />
              <button
                type="button"
                onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                className="px-3 text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end mb-10">
        <button
          type="button"
          onClick={() => setItems([...items, { product_name: "", quantity: 1, unit_price: 0 }])}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-full flex items-center gap-2 font-semibold text-sm"
        >
          <Plus className="w-4 h-4" /> LINHA
        </button>
      </div>

      {/* Totals */}
      <div className="border-2 border-primary rounded-xl overflow-hidden max-w-2xl mb-6">
        <Row label="Valor dos produtos:" value={productsTotal.toFixed(2)} readOnly />
        <Row label="Frete:" value={String(freight)} onChange={(v) => setFreight(Number(v))} />
        <Row label="VALOR TOTAL DA COMPRA:" value={total.toFixed(2)} readOnly bold />
      </div>

      {/* Status + notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="border-2 border-primary rounded-xl p-4">
          <label className="font-bold text-primary text-sm block mb-2">STATUS:</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full bg-white border border-primary/30 rounded-md px-3 py-2 outline-none"
          >
            <option value="em_aberto">Em aberto</option>
            <option value="producao">Produção</option>
            <option value="pago">Pago</option>
            <option value="fechado_pagamento">Fechado / pagamento</option>
          </select>
        </div>
        <div className="lg:col-span-2 border-2 border-primary rounded-xl p-4">
          <label className="font-bold text-primary text-sm block mb-2">OBSERVAÇÕES:</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-transparent outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between gap-3 print:hidden">
        <button
          onClick={handleDelete}
          className="px-4 py-2.5 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> Excluir
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/orcamentos" })}
            className="px-6 py-2.5 rounded-full bg-secondary text-secondary-foreground font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2.5 rounded-full bg-primary text-primary-foreground font-bold disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  onChange,
  readOnly,
  bold,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 border-b-2 border-primary last:border-0">
      <div className={`col-span-2 px-4 py-3 border-r-2 border-primary text-primary ${bold ? "font-bold" : "font-semibold"}`}>
        {label}
      </div>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`px-4 py-3 outline-none text-right ${readOnly ? "bg-accent/30" : ""} ${bold ? "font-bold" : ""}`}
      />
    </div>
  );
}
