import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useRefresh } from "@/lib/refresh-context";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

export const Route = createFileRoute("/status")({
  component: () => (
    <AppShell>
      <Statuses />
    </AppShell>
  ),
});

interface Status {
  id: string;
  name: string;
  color: string;
  sort_order: number;
}

const PRESET_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

function Statuses() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", color: PRESET_COLORS[0] });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", color: "" });

  const load = () => {
    if (!user) return;
    supabase
      .from("budget_statuses")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order")
      .order("created_at")
      .then(({ data }) => setStatuses((data as Status[]) || []));
  };

  const { bump } = useRefresh();

  useEffect(load, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name.trim()) return;
    const { error } = await supabase.from("budget_statuses").insert({
      user_id: user.id,
      name: form.name.trim(),
      color: form.color,
      sort_order: statuses.length,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status criado");
    setForm({ name: "", color: PRESET_COLORS[0] });
    setShowForm(false);
    load();
    try { bump(); } catch (e) {}
  };

  const startEdit = (s: Status) => {
    setEditingId(s.id);
    setEditForm({ name: s.name, color: s.color });
  };

  const saveEdit = async (id: string) => {
    if (!editForm.name.trim()) return;
    const { error } = await supabase
      .from("budget_statuses")
      .update({ name: editForm.name.trim(), color: editForm.color })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status atualizado");
    setEditingId(null);
    load();
    try { bump(); } catch (e) {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este status?")) return;
    const { error } = await supabase.from("budget_statuses").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Status excluído");
    load();
    try { bump(); } catch (e) {}
  };

  return (
    <div>
      <h1 className="font-display italic text-3xl text-primary mb-2">Criação de Status</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Crie e personalize os status que você usa nos seus orçamentos.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-primary/30 rounded-2xl p-6">
          <div className="grid grid-cols-12 gap-4 px-2 py-3 border-b font-semibold text-sm">
            <div className="col-span-1">Cor</div>
            <div className="col-span-8">Nome</div>
            <div className="col-span-3 text-right">Ações</div>
          </div>
          {statuses.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground text-sm">
              Nenhum status criado. Comece criando o primeiro!
            </div>
          ) : (
            statuses.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-12 gap-4 px-2 py-3 border-b last:border-0 text-sm items-center"
              >
                {editingId === s.id ? (
                  <>
                    <div className="col-span-1">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border"
                      />
                    </div>
                    <div className="col-span-8">
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full border rounded px-3 py-1.5"
                        autoFocus
                      />
                    </div>
                    <div className="col-span-3 flex justify-end gap-1">
                      <button
                        onClick={() => saveEdit(s.id)}
                        className="text-green-600 hover:bg-green-50 rounded p-1.5"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-muted-foreground hover:bg-muted rounded p-1.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-1">
                      <span
                        className="block w-6 h-6 rounded-full border"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                    <div className="col-span-8 font-medium">{s.name}</div>
                    <div className="col-span-3 flex justify-end gap-1">
                      <button
                        onClick={() => startEdit(s)}
                        className="text-primary hover:bg-primary/10 rounded p-1.5"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-destructive hover:bg-destructive/10 rounded p-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full flex items-center justify-center gap-2 font-semibold"
          >
            <Plus className="w-4 h-4" /> NOVO STATUS
          </button>

          {showForm && (
            <form onSubmit={handleAdd} className="border border-primary/30 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Aguardando aprovação"
                  required
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Cor</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        form.color === c ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-2 rounded-full font-semibold"
              >
                Salvar
              </button>
            </form>
          )}

          <div className="bg-primary text-primary-foreground rounded-2xl p-6 text-center">
            <div className="font-semibold">Status Cadastrados:</div>
            <div className="text-3xl font-bold">{statuses.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
