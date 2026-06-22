import { useMemo, useState } from "react";
import { Search, UserRound, X } from "lucide-react";

type Client = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  cpf?: string | null;
};

type ClientPickerProps = {
  clients: Client[];
  selectedClientId: string;
  fallbackName?: string;
  onSelect: (clientId: string) => void;
};

function clientCode(index: number) {
  return String(index + 1).padStart(4, "0");
}

export function ClientPicker({ clients, selectedClientId, fallbackName, onSelect }: ClientPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedIndex = clients.findIndex((client) => client.id === selectedClientId);
  const selectedClient = selectedIndex >= 0 ? clients[selectedIndex] : null;
  const selectedLabel = selectedClient
    ? `${clientCode(selectedIndex)} - ${selectedClient.name}`
    : fallbackName || "Sem cliente cadastrado";

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return clients;

    return clients.filter((client, index) => {
      const code = clientCode(index);
      return (
        code.includes(term) ||
        client.name?.toLowerCase().includes(term) ||
        client.phone?.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.cpf?.toLowerCase().includes(term)
      );
    });
  }, [clients, search]);

  const selectClient = (clientId: string) => {
    onSelect(clientId);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-primary text-primary-foreground rounded-md px-3 py-1 w-full sm:w-72 text-left flex items-center justify-between gap-2"
      >
        <span className="truncate">{selectedLabel}</span>
        <Search className="w-4 h-4 shrink-0" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 px-4 py-6 flex items-center justify-center">
          <div className="bg-background text-foreground rounded-lg shadow-xl border border-border w-full max-w-2xl max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between gap-3 p-4 border-b">
              <h2 className="font-display italic text-2xl text-primary">Localizar Cliente</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full hover:bg-accent text-primary"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="flex items-center gap-2 border border-border rounded-full px-4 py-2">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  autoFocus
                  placeholder="Buscar por codigo ou nome"
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => selectClient("")}
                className="w-full grid grid-cols-12 gap-3 px-4 py-3 text-left hover:bg-accent border-b"
              >
                <div className="col-span-2 font-bold text-primary">--</div>
                <div className="col-span-10">
                  <div className="font-semibold">Sem cliente cadastrado</div>
                  <div className="text-xs text-muted-foreground">Orcamento avulso</div>
                </div>
              </button>

              {filteredClients.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</div>
              ) : (
                filteredClients.map((client) => {
                  const originalIndex = clients.findIndex((item) => item.id === client.id);
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => selectClient(client.id)}
                      className="w-full grid grid-cols-12 gap-3 px-4 py-3 text-left hover:bg-accent border-b last:border-0"
                    >
                      <div className="col-span-2 font-bold text-primary">{clientCode(originalIndex)}</div>
                      <div className="col-span-10 min-w-0">
                        <div className="font-semibold truncate flex items-center gap-2">
                          <UserRound className="w-4 h-4 shrink-0" />
                          <span className="truncate">{client.name}</span>
                        </div>
                        {(client.phone || client.email || client.cpf) && (
                          <div className="text-xs text-muted-foreground truncate">
                            {[client.phone, client.email, client.cpf].filter(Boolean).join(" | ")}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
