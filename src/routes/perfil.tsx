import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil")({
  component: () => (
    <AppShell>
      <Profile />
    </AppShell>
  ),
});

function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", company: "", phone: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm({ name: data.name || "", company: data.company || "", phone: data.phone || "" });
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...form });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil atualizado!");
  };

  return (
    <div>
      <h1 className="font-display italic text-3xl text-primary mb-8">Meu Perfil</h1>
      <form onSubmit={handleSave} className="bg-primary text-primary-foreground rounded-2xl p-8 space-y-5 max-w-2xl">
        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input value={user?.email || ""} disabled className="bg-white/40 text-foreground rounded-full px-4 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Nome</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-white text-foreground rounded-full px-4 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Empresa / negócio</label>
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-white text-foreground rounded-full px-4 py-2 w-full" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Telefone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-white text-foreground rounded-full px-4 py-2 w-full" />
        </div>
        <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-full bg-white text-primary font-bold disabled:opacity-60">
          {loading ? "..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
