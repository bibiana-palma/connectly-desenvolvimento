import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CurrencyInput } from "@/components/CurrencyInput";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone } from "@/lib/phone";
import { formatDocument } from "@/lib/document";
import { parseWholeNumberInput } from "@/lib/whole-number";
import { toast } from "sonner";
import { Building2, FileText, SlidersHorizontal, UserRound } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/perfil")({
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

type TabId = "perfil" | "empresa" | "orcamentos" | "preferencias";

type ProfileForm = {
  name: string;
  phone: string;
};

type SettingsForm = {
  company_name: string;
  company_document: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  default_freight: number;
  quote_validity_days: number;
  default_budget_notes: string;
  show_inactive_products: boolean;
  require_client_document: boolean;
  require_client_phone: boolean;
};

const tabs: Array<{ id: TabId; label: string; icon: typeof UserRound }> = [
  { id: "perfil", label: "Perfil", icon: UserRound },
  { id: "empresa", label: "Empresa", icon: Building2 },
  { id: "orcamentos", label: "Orcamentos", icon: FileText },
  { id: "preferencias", label: "Preferencias", icon: SlidersHorizontal },
];

const emptySettings: SettingsForm = {
  company_name: "",
  company_document: "",
  company_email: "",
  company_phone: "",
  company_address: "",
  default_freight: 0,
  quote_validity_days: 7,
  default_budget_notes: "",
  show_inactive_products: true,
  require_client_document: false,
  require_client_phone: false,
};

function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("perfil");
  const [profile, setProfile] = useState<ProfileForm>({ name: "", phone: "" });
  const [settings, setSettings] = useState<SettingsForm>(emptySettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fallback = getProfileFallback(user);
    setProfile({ name: fallback.name, phone: fallback.phone });
    setSettings({ ...emptySettings, company_name: fallback.company });

    (async () => {
      const [{ data: profileData }, { data: settingsData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      const profileName = profileData?.name || fallback.name;
      const profilePhone = profileData?.phone || fallback.phone;
      const companyName = profileData?.company || fallback.company;

      setProfile({
        name: profileName,
        phone: profilePhone,
      });
      setSettings({
        ...emptySettings,
        company_name: settingsData?.company_name || companyName,
        company_document: settingsData?.company_document || "",
        company_email: settingsData?.company_email || "",
        company_phone: settingsData?.company_phone || "",
        company_address: settingsData?.company_address || "",
        default_freight: Number(settingsData?.default_freight || 0),
        quote_validity_days: Number(settingsData?.quote_validity_days || 7),
        default_budget_notes: settingsData?.default_budget_notes || "",
        show_inactive_products: settingsData?.show_inactive_products ?? true,
        require_client_document: settingsData?.require_client_document ?? false,
        require_client_phone: settingsData?.require_client_phone ?? false,
      });
    })();
  }, [user]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setLoading(true);
    const [profileResult, settingsResult] = await Promise.all([
      supabase.from("profiles").upsert({
        id: user.id,
        name: profile.name,
        phone: profile.phone,
        company: settings.company_name,
      }),
      supabase.from("user_settings").upsert({
        user_id: user.id,
        ...settings,
      }),
    ]);
    setLoading(false);

    const error = profileResult.error || settingsResult.error;
    if (error) toast.error(error.message);
    else toast.success("Configuracoes salvas!");
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display italic text-3xl text-primary">Configuracoes</h1>
          <p className="text-muted-foreground mt-1">Organize os dados principais do seu sistema.</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-8 py-2.5 rounded-full font-bold disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar Configuracoes"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`border rounded-lg px-4 py-4 flex items-center gap-3 font-semibold transition ${
                active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-primary border-primary/30 hover:bg-accent"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="border border-primary/30 rounded-2xl p-5 sm:p-7 bg-card">
        {activeTab === "perfil" && <ProfileSection userEmail={user?.email || ""} profile={profile} setProfile={setProfile} />}
        {activeTab === "empresa" && <CompanySection settings={settings} setSettings={setSettings} />}
        {activeTab === "orcamentos" && <BudgetSection settings={settings} setSettings={setSettings} />}
        {activeTab === "preferencias" && <PreferencesSection settings={settings} setSettings={setSettings} />}
      </div>
    </form>
  );
}

function ProfileSection({
  userEmail,
  profile,
  setProfile,
}: {
  userEmail: string;
  profile: ProfileForm;
  setProfile: (value: ProfileForm) => void;
}) {
  return (
    <section className="space-y-5">
      <SectionTitle title="Perfil" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Email" value={userEmail} disabled onChange={() => undefined} />
        <Field label="Nome" value={profile.name} onChange={(value) => setProfile({ ...profile, name: value })} />
        <Field
          label="Telefone"
          value={profile.phone}
          onChange={(value) => setProfile({ ...profile, phone: formatPhone(value) })}
          placeholder="(51) 3566-10107"
          maxLength={16}
        />
      </div>
    </section>
  );
}

function CompanySection({
  settings,
  setSettings,
}: {
  settings: SettingsForm;
  setSettings: (value: SettingsForm) => void;
}) {
  return (
    <section className="space-y-5">
      <SectionTitle title="Empresa" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Nome da empresa"
          value={settings.company_name}
          onChange={(value) => setSettings({ ...settings, company_name: value })}
        />
        <Field
          label="CNPJ"
          value={settings.company_document}
          onChange={(value) => setSettings({ ...settings, company_document: formatDocument(value, true) })}
          placeholder="00.000.000/0000-00"
          maxLength={18}
        />
        <Field
          label="Email da empresa"
          type="email"
          value={settings.company_email}
          onChange={(value) => setSettings({ ...settings, company_email: value })}
        />
        <Field
          label="Telefone da empresa"
          value={settings.company_phone}
          onChange={(value) => setSettings({ ...settings, company_phone: formatPhone(value) })}
          placeholder="(51) 3566-10107"
          maxLength={16}
        />
        <div className="md:col-span-2">
          <Field
            label="Endereco da empresa"
            value={settings.company_address}
            onChange={(value) => setSettings({ ...settings, company_address: value })}
          />
        </div>
      </div>
    </section>
  );
}

function BudgetSection({
  settings,
  setSettings,
}: {
  settings: SettingsForm;
  setSettings: (value: SettingsForm) => void;
}) {
  return (
    <section className="space-y-5">
      <SectionTitle title="Orcamentos" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1 text-primary">Frete padrao</label>
          <CurrencyInput
            value={settings.default_freight}
            onChange={(value) => setSettings({ ...settings, default_freight: value })}
            className="bg-white text-foreground rounded-lg px-4 py-2 outline-none w-full border border-border"
          />
        </div>
        <Field
          label="Validade do orcamento em dias"
          value={String(settings.quote_validity_days)}
          onChange={(value) =>
            setSettings({ ...settings, quote_validity_days: parseWholeNumberInput(value, 1) })
          }
          inputMode="numeric"
        />
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-1 text-primary">Observacoes padrao</label>
          <textarea
            value={settings.default_budget_notes}
            onChange={(event) => setSettings({ ...settings, default_budget_notes: event.target.value })}
            rows={5}
            className="bg-white text-foreground rounded-lg px-4 py-3 outline-none w-full border border-border resize-none"
          />
        </div>
      </div>
    </section>
  );
}

function PreferencesSection({
  settings,
  setSettings,
}: {
  settings: SettingsForm;
  setSettings: (value: SettingsForm) => void;
}) {
  return (
    <section className="space-y-5">
      <SectionTitle title="Preferencias" />
      <div className="max-w-xl space-y-3">
          <Toggle
            label="Mostrar produtos desativados"
            checked={settings.show_inactive_products}
            onChange={(checked) => setSettings({ ...settings, show_inactive_products: checked })}
          />
          <Toggle
            label="Exigir CPF/CNPJ no cliente"
            checked={settings.require_client_document}
            onChange={(checked) => setSettings({ ...settings, require_client_document: checked })}
          />
          <Toggle
            label="Exigir telefone no cliente"
            checked={settings.require_client_phone}
            onChange={(checked) => setSettings({ ...settings, require_client_phone: checked })}
          />
      </div>
    </section>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="font-display italic text-2xl text-primary">{title}</h2>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  placeholder,
  maxLength,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block text-sm font-semibold text-primary">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        className="mt-1 bg-white text-foreground rounded-lg px-4 py-2 outline-none w-full border border-border disabled:bg-muted disabled:text-muted-foreground"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 border border-border rounded-lg px-4 py-3 text-sm font-semibold text-primary bg-white">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-primary"
      />
    </label>
  );
}

function getProfileFallback(user: User) {
  const metadata = user.user_metadata ?? {};

  return {
    name: typeof metadata.name === "string" ? metadata.name : "",
    company: typeof metadata.company === "string" ? metadata.company : "",
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
  };
}
