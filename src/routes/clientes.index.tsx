import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/clientes/")({
  component: () => (
    <AppShell>
      <ClientsList />
    </AppShell>
  ),
});

const STATUS_LABELS: Record<string, string> = {
  lead: "LEAD",
  cliente: "Cliente",
};

function ClientsList() {
  const { user } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setClients(data || []));
  }, [user]);

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="font-display italic text-2xl xl:text-3xl text-primary">Clientes</h1>
        <div className="flex gap-3">
          <Link
            to="/clientes/novo"
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" /> LEAD
          </Link>
          <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90">
            <Search className="w-4 h-4" /> PESQUISAR
          </button>
        </div>
      </div>

      <div className="border border-primary/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg max-w-xs"
          />
          <SlidersHorizontal className="w-5 h-5 text-primary" />
        </div>
        <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b font-semibold text-sm">
          <div className="col-span-2">Código</div>
          <div className="col-span-6">Nome</div>
          <div className="col-span-4">Pendências</div>
        </div>
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-muted-foreground">
            Nenhum cliente cadastrado.{" "}
            <Link to="/clientes/novo" className="text-primary underline">
              Cadastrar agora
            </Link>
          </div>
        ) : (
          filtered.map((c, i) => (
            <Link
              key={c.id}
              to="/clientes/$id"
              params={{ id: c.id }}
              className="grid grid-cols-12 gap-4 px-4 py-3 border-b last:border-0 hover:bg-accent/50 text-sm"
            >
              <div className="col-span-2 font-bold">
                {String(i + 1).padStart(4, "0")}
              </div>
              <div className="col-span-6">{c.name}</div>
              <div className="col-span-4">{STATUS_LABELS[c.notes] || c.notes || "—"}</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
