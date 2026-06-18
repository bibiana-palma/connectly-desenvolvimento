import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ensureDefaultBudgetStatuses } from "@/lib/budget-statuses";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function profileFromUser(user: User) {
  const metadata = user.user_metadata ?? {};

  return {
    id: user.id,
    name: typeof metadata.name === "string" ? metadata.name : "",
    company: typeof metadata.company === "string" ? metadata.company : "",
    phone: typeof metadata.phone === "string" ? metadata.phone : "",
  };
}

async function ensureUserProfile(user: User) {
  const metadataProfile = profileFromUser(user);

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, company, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar perfil do usuario", error);
    return;
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from("profiles")
      .upsert(metadataProfile, { onConflict: "id" });
    if (insertError) console.error("Erro ao criar perfil do usuario", insertError);
    return;
  }

  const patch = {
    name: data.name || metadataProfile.name,
    company: data.company || metadataProfile.company,
    phone: data.phone || metadataProfile.phone,
  };

  if (patch.name !== data.name || patch.company !== data.company || patch.phone !== data.phone) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id);
    if (updateError) console.error("Erro ao atualizar perfil do usuario", updateError);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) setTimeout(() => void ensureUserProfile(newSession.user), 0);
      if (newSession?.user) setTimeout(() => void ensureDefaultBudgetStatuses(newSession.user.id), 0);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) void ensureUserProfile(data.session.user);
      if (data.session?.user) void ensureDefaultBudgetStatuses(data.session.user.id);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
