import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Power, Search, Trash2 } from "lucide-react";

export const Route = createFileRoute("/produtos")({
  component: () => (
    <AppShell>
      <Products />
    </AppShell>
  ),
});

type ProductForm = {
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
};

function Products() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    price: 0,
    stock_quantity: 0,
  });

  const load = () => {
    if (!user) return;
    supabase
      .from("products")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at")
      .then(({ data }) => setProducts(data || []));
  };

  useEffect(load, [user]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );
  const active = products.filter((p) => p.is_active).length;
  const inactive = products.length - active;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const productPayload = {
      name: form.name,
      description: form.description,
      price: form.price,
      user_id: user.id,
      is_active: true,
      ...(form.stock_quantity > 0 ? { stock_quantity: form.stock_quantity } : {}),
    };

    const { error } = await supabase.from("products").insert(productPayload);

    if (error) toast.error(error.message);
    else {
      toast.success("Produto cadastrado");
      setForm({ name: "", description: "", price: 0, stock_quantity: 0 });
      setShowForm(false);
      load();
    }
  };

  const handleToggleActive = async (product: any) => {
    const { error } = await supabase
      .from("products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) toast.error(error.message);
    else {
      toast.success(product.is_active ? "Produto desativado" : "Produto ativado");
      load();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Produto excluido");
      load();
    }
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
          <div className="grid grid-cols-12 gap-3 px-4 py-3 border-b font-semibold text-sm">
            <div className="col-span-2">Codigo</div>
            <div className="col-span-3">Nome</div>
            <div className="col-span-2 text-right">Estoque</div>
            <div className="col-span-2 text-right">Valor</div>
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2 text-right">Acoes</div>
          </div>
          {filtered.length === 0 ? (
            <div className="px-4 py-12 text-center text-muted-foreground text-sm">Nenhum produto</div>
          ) : (
            filtered.map((p, i) => (
              <div
                key={p.id}
                className={`grid grid-cols-12 gap-3 px-4 py-3 border-b last:border-0 text-sm items-center ${
                  p.is_active ? "" : "opacity-60"
                }`}
              >
                <div className="col-span-2 font-bold">{String(i + 1).padStart(4, "0")}</div>
                <div className="col-span-3">
                  <div className="font-medium">{p.name}</div>
                  {p.description && <div className="text-xs text-muted-foreground truncate">{p.description}</div>}
                </div>
                <div className="col-span-2 text-right">{Number(p.stock_quantity || 0)}</div>
                <div className="col-span-2 text-right">
                  {Number(p.price || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </div>
                <div className="col-span-1 text-center">
                  <span className={`text-xs font-semibold ${p.is_active ? "text-green-700" : "text-muted-foreground"}`}>
                    {p.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(p)}
                    title={p.is_active ? "Desativar produto" : "Ativar produto"}
                    className="text-primary hover:bg-primary/10 rounded p-1.5"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    title="Excluir produto"
                    className="text-destructive hover:bg-destructive/10 rounded p-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <button className="w-full bg-primary text-primary-foreground py-3 rounded-full flex items-center justify-center gap-2 font-semibold">
            <Search className="w-4 h-4" /> PESQUISAR
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full bg-primary text-primary-foreground py-3 rounded-full flex items-center justify-center gap-2 font-semibold"
          >
            <Plus className="w-4 h-4" /> NOVO PRODUTO
          </button>

          {showForm && (
            <form onSubmit={handleAdd} className="border border-primary/30 rounded-xl p-4 space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome"
                required
                className="w-full border rounded px-3 py-2"
              />
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descricao"
                className="w-full border rounded px-3 py-2"
              />
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Quantidade em estoque</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2 mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Valor do produto</label>
                <CurrencyInput
                  value={form.price}
                  onChange={(value) => setForm({ ...form, price: value })}
                  className="w-full border rounded px-3 py-2 mt-1 outline-none"
                />
              </div>
              <button type="submit" className="w-full bg-primary text-primary-foreground py-2 rounded-full font-semibold">
                Salvar
              </button>
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
