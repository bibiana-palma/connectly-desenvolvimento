import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone } from "@/lib/phone";
import { formatDocument, isDocumentComplete } from "@/lib/document";
import { formatCep } from "@/lib/address";
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
    cep: "",
    street: "",
    neighborhood: "",
    complement: "",
    cpf: "",
    email: "",
    notes: "",
    is_legal_entity: false,
  });
  const [loading, setLoading] = useState(false);
  const isLegalEntity = form.is_legal_entity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.cpf && !isDocumentComplete(form.cpf, isLegalEntity)) {
      toast.error(isLegalEntity ? "CNPJ precisa ter 14 numeros" : "CPF precisa ter 11 numeros");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("clients").insert({
      ...form,
      address: form.street,
      secondary_address: form.complement,
      user_id: user.id,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Cliente cadastrado!");
      navigate({ to: "/clientes" });
    }
  };

  return (
    <div>
      <h1 className="font-display italic text-3xl text-primary mb-8">Cadastro de Cliente</h1>

      <form onSubmit={handleSubmit} className="bg-primary text-primary-foreground rounded-2xl p-6 sm:p-8 space-y-6 max-w-5xl">
        <div className="flex justify-end items-center gap-3 border-b border-white/20 pb-4">
          <span className="text-sm font-semibold">{isLegalEntity ? "Pessoa juridica" : "Pessoa fisica"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={isLegalEntity}
            onClick={() =>
              setForm({
                ...form,
                is_legal_entity: !isLegalEntity,
                cpf: formatDocument(form.cpf, !isLegalEntity),
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
          <Field
            label={isLegalEntity ? "Razao social:" : "Nome:"}
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            placeholder={isLegalEntity ? "Ex: Empresa Exemplo LTDA" : "Ex: Maria Silva"}
            required
          />
          <Field
            label={isLegalEntity ? "CNPJ:" : "CPF:"}
            value={form.cpf}
            onChange={(v) => setForm({ ...form, cpf: formatDocument(v, isLegalEntity) })}
            placeholder={isLegalEntity ? "00.000.000/0000-00" : "000.000.000-00"}
            maxLength={isLegalEntity ? 18 : 14}
          />
          <Field
            label="Telefone:"
            value={form.phone}
            onChange={(v) => setForm({ ...form, phone: formatPhone(v) })}
            placeholder="(51) 3566-10107"
            maxLength={16}
          />
          <Field label="Email:" value={form.email} onChange={(v) => setForm({ ...form, email: v })} type="email" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-white/20 pt-5">
          <Field
            label="CEP:"
            value={form.cep}
            onChange={(v) => setForm({ ...form, cep: formatCep(v) })}
            placeholder="00000-000"
            maxLength={9}
          />
          <div className="md:col-span-3">
            <Field
              label="Rua:"
              value={form.street}
              onChange={(v) => setForm({ ...form, street: v })}
              placeholder="Ex: Rua das Flores"
            />
          </div>
          <Field
            label="Bairro:"
            value={form.neighborhood}
            onChange={(v) => setForm({ ...form, neighborhood: v })}
            placeholder="Ex: Centro"
          />
          <div className="md:col-span-3">
            <Field
              label="Complemento:"
              value={form.complement}
              onChange={(v) => setForm({ ...form, complement: v })}
              placeholder="Ex: Sala 2, apartamento, ponto de referencia"
            />
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-4 mt-4">
          <label className="font-bold text-primary text-sm block mb-2">OBSERVACOES:</label>
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
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  small?: boolean;
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
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`bg-white text-foreground rounded-lg px-4 py-2 outline-none ${small ? "w-64 max-w-full" : "w-full"}`}
      />
    </div>
  );
}
