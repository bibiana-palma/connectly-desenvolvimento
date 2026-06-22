import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone } from "@/lib/phone";
import { formatDocument, isDocumentComplete } from "@/lib/document";
import { formatCep } from "@/lib/address";
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
      .then(({ data }) => {
        if (!data) {
          setForm(null);
          return;
        }
        setForm({
          ...data,
          cep: data.cep || "",
          street: data.street || data.address || "",
          neighborhood: data.neighborhood || "",
          complement: data.complement || data.secondary_address || "",
        });
      });
  }, [id, user]);

  if (!form) return <div className="text-muted-foreground">Carregando...</div>;

  const handleSave = async () => {
    if (form.cpf && !isDocumentComplete(form.cpf, isLegalEntity)) {
      toast.error(isLegalEntity ? "CNPJ precisa ter 14 numeros" : "CPF precisa ter 11 numeros");
      return;
    }

    setLoading(true);
    const { id: _id, user_id, created_at, updated_at, ...patch } = form;
    const { error } = await supabase
      .from("clients")
      .update({
        ...patch,
        address: form.street || "",
        secondary_address: form.complement || "",
      })
      .eq("id", id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Cliente atualizado!");
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este cliente?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Cliente excluido");
      navigate({ to: "/clientes" });
    }
  };

  const isLegalEntity = Boolean(form.is_legal_entity);

  return (
    <div>
      <button onClick={() => navigate({ to: "/clientes" })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <h1 className="font-display italic text-3xl text-primary mb-8">Editar Cliente</h1>

      <div className="bg-primary text-primary-foreground rounded-2xl p-6 sm:p-8 space-y-6 max-w-5xl">
        <div className="flex justify-end items-center gap-3 border-b border-white/20 pb-4">
          <span className="text-sm font-semibold">
            {isLegalEntity ? "Pessoa juridica" : "Pessoa fisica"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isLegalEntity}
            onClick={() =>
              setForm({
                ...form,
                is_legal_entity: !isLegalEntity,
                cpf: formatDocument(form.cpf || "", !isLegalEntity),
              })
            }
            className={`w-12 h-6 rounded-full transition relative ${isLegalEntity ? "bg-white" : "bg-white/30"}`}
          >
            <span
              className={`absolute top-0.5 ${isLegalEntity ? "right-0.5" : "left-0.5"} w-5 h-5 rounded-full transition`}
              style={{
                background: isLegalEntity ? "hsl(var(--primary))" : "white",
              }}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditField
            label={isLegalEntity ? "Razao social:" : "Nome:"}
            value={form.name || ""}
            onChange={(value) => setForm({ ...form, name: value })}
            required
          />
          <EditField
            label={isLegalEntity ? "CNPJ:" : "CPF:"}
            value={form.cpf || ""}
            onChange={(value) => setForm({ ...form, cpf: formatDocument(value, isLegalEntity) })}
            placeholder={isLegalEntity ? "00.000.000/0000-00" : "000.000.000-00"}
            maxLength={isLegalEntity ? 18 : 14}
          />
          <EditField
            label="Telefone:"
            value={form.phone || ""}
            onChange={(value) => setForm({ ...form, phone: formatPhone(value) })}
            placeholder="(51) 3566-10107"
            maxLength={16}
          />
          <EditField
            label="Email:"
            value={form.email || ""}
            onChange={(value) => setForm({ ...form, email: value })}
            type="email"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-white/20 pt-5">
          <EditField
            label="CEP:"
            value={form.cep || ""}
            onChange={(value) => setForm({ ...form, cep: formatCep(value) })}
            placeholder="00000-000"
            maxLength={9}
          />
          <div className="md:col-span-3">
            <EditField
              label="Rua:"
              value={form.street || ""}
              onChange={(value) => setForm({ ...form, street: value })}
            />
          </div>
          <EditField
            label="Bairro:"
            value={form.neighborhood || ""}
            onChange={(value) => setForm({ ...form, neighborhood: value })}
          />
          <div className="md:col-span-3">
            <EditField
              label="Complemento:"
              value={form.complement || ""}
              onChange={(value) => setForm({ ...form, complement: value })}
            />
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-4">
          <label className="font-bold text-primary text-sm block mb-2">OBSERVACOES:</label>
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

function EditField({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className="bg-white text-foreground rounded-lg px-4 py-2 outline-none w-full"
      />
    </div>
  );
}
