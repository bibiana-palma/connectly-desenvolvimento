import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";

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
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "person" | "company">("all");
  const [contactFilter, setContactFilter] = useState<"all" | "phone" | "email" | "missing_contact">("all");
  const [sortBy, setSortBy] = useState<"created" | "name" | "recent">("created");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setClients(data || []));
  }, [user]);

  const filtered = clients
    .filter((c) => {
      const term = search.toLowerCase();
      const matchesSearch =
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.cpf?.toLowerCase().includes(term);

      if (!matchesSearch) return false;
      if (typeFilter === "person" && c.is_legal_entity) return false;
      if (typeFilter === "company" && !c.is_legal_entity) return false;
      if (contactFilter === "phone" && !c.phone) return false;
      if (contactFilter === "email" && !c.email) return false;
      if (contactFilter === "missing_contact" && (c.phone || c.email)) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
      if (sortBy === "recent") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
    });

  const hasFilters = typeFilter !== "all" || contactFilter !== "all" || sortBy !== "created";

  const clearFilters = () => {
    setTypeFilter("all");
    setContactFilter("all");
    setSortBy("created");
  };

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
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full flex items-center gap-2 font-semibold hover:bg-primary/90"
          >
            <Search className="w-4 h-4" /> PESQUISAR
          </button>
        </div>
      </div>

      <div className="border border-primary/30 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg max-w-xs flex-1"
          />
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={`p-2 rounded-lg border transition-colors ${
              showFilters || hasFilters
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-primary hover:bg-accent"
            }`}
            aria-label="Filtros"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="mb-4 p-4 border border-border rounded-lg bg-accent/30 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Filtros</span>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  <X className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="text-xs font-semibold text-muted-foreground">
                Tipo
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                  className="mt-1 w-full border rounded px-3 py-2 bg-background text-foreground"
                >
                  <option value="all">Todos</option>
                  <option value="person">Pessoa fisica</option>
                  <option value="company">Pessoa juridica</option>
                </select>
              </label>

              <label className="text-xs font-semibold text-muted-foreground">
                Contato
                <select
                  value={contactFilter}
                  onChange={(e) => setContactFilter(e.target.value as typeof contactFilter)}
                  className="mt-1 w-full border rounded px-3 py-2 bg-background text-foreground"
                >
                  <option value="all">Todos</option>
                  <option value="phone">Com telefone</option>
                  <option value="email">Com email</option>
                  <option value="missing_contact">Sem contato</option>
                </select>
              </label>

              <label className="text-xs font-semibold text-muted-foreground">
                Ordenar
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="mt-1 w-full border rounded px-3 py-2 bg-background text-foreground"
                >
                  <option value="created">Mais antigos</option>
                  <option value="recent">Mais recentes</option>
                  <option value="name">Nome</option>
                </select>
              </label>
            </div>
          </div>
        )}

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
