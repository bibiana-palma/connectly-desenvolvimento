import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Search, Trash2 } from "lucide-react";

export const Route = createFileRoute("/produtos")({
  component: () => (
    <AppShell>
      <Products />
    </AppShell>
  ),
});

function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: 0 });

  const load = () => {
    if (!user) return;
    supabase.from("products").select("*").eq("user_id", user.id).order("created_at").then(({ data }) => setProducts(data || []));
  };
  useEffect(load, [user]);

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const active = products.filter((p) => p.is_active).length;
  const inactive = products.length - active;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("products").insert({ ...form, user_id: user.id });
    if (error) toast.error(error.message);
    else {
      toast.success("Produto cadastrado");
      setForm({ name: "", description: "", price: 0 });
      setShowForm(false);
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    load();
  };

  return (
    <div>
      <h1 className="font-display italic text-3xl text-primary mb-8">Produtos</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-primary/30 rounded-2xl p-6">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg w-full mb-4"
          />
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b font-semibold text-sm">
            <div className="col-span-2">Código</div>
            <div className="col-span-6">Nome</div>
            <div className="col-span-3 text-right">Preço</div>
            <div className="col-span-1"></div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground text-sm">Nenhum produto</div>
          ) : (
            filtered.map((p, i) => (
              <div key={p.id} className="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-0 text-sm items-center">
                <div className="col-span-2 font-bold">{String(i + 1).padStart(4, "0")}</div>
                <div className="col-span-6">{p.name}</div>
                <div className="col-span-3 text-right">R$ {Number(p.price).toFixed(2)}</div>
                <button onClick={() => handleDelete(p.id)} className="col-span-1 text-destructive hover:bg-destructive/10 rounded p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <button className="w-full bg-primary text-primary-foreground py-3 rounded-full flex items-center justify-center gap-2 font-semibold">
            <Search className="w-4 h-4" /> PESQUISAR
          </button>
          <button onClick={() => setShowForm(!showForm)} className="w-full bg-primary text-primary-foreground py-3 rounded-full flex items-center justify-center gap-2 font-semibold">
            <Plus className="w-4 h-4" /> NOVO PRODUTO
          </button>

          {showForm && (
            <form onSubmit={handleAdd} className="border border-primary/30 rounded-xl p-4 space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" required className="w-full border rounded px-3 py-2" />
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição" className="w-full border rounded px-3 py-2" />
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} placeholder="Preço" className="w-full border rounded px-3 py-2" />
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-full font-semibold">Salvar</button>
            </form>
          )}

          <div className="bg-primary text-primary-foreground rounded-2xl p-6 space-y-4 text-center">
            <div>
              <div className="font-semibold">Produtos Cadastrados:</div>
              <div className="text-3xl font-bold">{products.length}</div>
            </div>
            <hr className="border-primary-foreground/20" />
            <div>
              <div className="font-semibold">Produtos Desativados:</div>
              <div className="text-3xl font-bold">{inactive}</div>
            </div>
            <hr className="border-primary-foreground/20" />
            <div>
              <div className="font-semibold">Ativos:</div>
              <div className="text-3xl font-bold">{active}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
