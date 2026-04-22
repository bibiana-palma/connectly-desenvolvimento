import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Trash2 } from "lucide-react";

export const Route = createFileRoute("/clientes/$id")({
  component: () => (
    <AppShell>
      <ClientDetail />
    </AppShell>
  ),
});

function ClientDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setForm(data));
  }, [id, user]);

  if (!form) return <div className="text-muted-foreground">Carregando...</div>;

  const handleSave = async () => {
    setLoading(true);
    const { id: _id, user_id, created_at, updated_at, ...patch } = form;
    const { error } = await supabase.from("clients").update(patch).eq("id", id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Cliente atualizado!");
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este cliente?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Cliente excluído");
      navigate({ to: "/clientes" });
    }
  };

  return (
    <div>
      <button onClick={() => navigate({ to: "/clientes" })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h1 className="font-display italic text-3xl text-primary mb-8">Editar Cliente</h1>

      <div className="bg-primary text-primary-foreground rounded-2xl p-8 space-y-5 max-w-4xl">
        {[
          ["Nome:", "name"],
          ["Telefone:", "phone"],
          ["Endereço (entrega):", "address"],
          ["Endereço (secundário):", "secondary_address"],
          ["CPF:", "cpf"],
          ["Email:", "email"],
        ].map(([label, key]) => (
          <div key={key}>
            <label className="block text-sm font-semibold mb-1">{label}</label>
            <input
              type="text"
              value={form[key as string] || ""}
              onChange={(e) => setForm({ ...form, [key as string]: e.target.value })}
              className="bg-white text-foreground rounded-full px-4 py-2 outline-none w-full"
            />
          </div>
        ))}
        <div className="bg-card text-card-foreground rounded-lg p-4">
          <label className="font-bold text-primary text-sm block mb-2">OBSERVAÇÕES:</label>
          <textarea
            value={form.notes || ""}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full bg-transparent outline-none resize-none"
          />
        </div>

        <div className="flex justify-between pt-4">
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-semibold flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 rounded-full bg-white text-primary font-bold text-sm hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
