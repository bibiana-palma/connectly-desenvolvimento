import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/clientes/novo")({
  component: () => (
    <AppShell>
      <NewClient />
    </AppShell>
  ),
});

function NewClient() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    secondary_address: "",
    cpf: "",
    email: "",
    notes: "",
    is_legal_entity: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("clients").insert({ ...form, user_id: user.id });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Cliente cadastrado!");
      navigate({ to: "/clientes" });
    }
  };

  return (
    <div>
      <h1 className="font-display italic text-3xl text-primary mb-8">Cadastro</h1>

      <form onSubmit={handleSubmit} className="bg-primary text-primary-foreground rounded-2xl p-8 space-y-5 max-w-4xl">
        <div className="flex justify-end items-center gap-3">
          <label className="text-sm underline cursor-pointer">Pessoa Jurídica</label>
          <button
            type="button"
            onClick={() => setForm({ ...form, is_legal_entity: !form.is_legal_entity })}
            className={`w-12 h-6 rounded-full transition relative ${form.is_legal_entity ? "bg-white" : "bg-white/30"}`}
          >
            <span
              className={`absolute top-0.5 ${form.is_legal_entity ? "right-0.5" : "left-0.5"} w-5 h-5 rounded-full bg-primary-foreground transition`}
              style={{
                background: form.is_legal_entity ? "hsl(var(--primary))" : "white",
              }}
            />
          </button>
        </div>

        <Field label="Nome:" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Telefone:" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} small />
        <Field label="Endereço (entrega):" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
        <Field label="Endereço (secundário):" value={form.secondary_address} onChange={(v) => setForm({ ...form, secondary_address: v })} />
        <Field label="CPF:" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} small />
        <Field label="Email:" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />

        <div className="bg-card text-card-foreground rounded-lg p-4 mt-4">
          <label className="font-bold text-primary text-sm block mb-2">OBSERVAÇÕES:</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className="w-full bg-transparent outline-none resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate({ to: "/clientes" })}
            className="px-6 py-2 rounded-full bg-white/20 hover:bg-white/30 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-full bg-white text-primary font-bold text-sm hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  small,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  small?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`bg-white text-foreground rounded-full px-4 py-2 outline-none ${small ? "w-64" : "w-full"}`}
      />
    </div>
  );
}
