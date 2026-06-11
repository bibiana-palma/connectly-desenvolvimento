import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/debug/profiles")({
  component: () => (
    <AppShell>
      <DebugProfiles />
    </AppShell>
  ),
});

function DebugProfiles() {
  const [profiles, setProfiles] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("profiles")
      .select("*")
      .then((res: any) => {
        setProfiles(res?.data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-display italic text-3xl text-primary mb-6">Debug: Profiles</h1>
      <div className="border rounded p-4 bg-card">
        {loading && <div>Carregando...</div>}
        {!loading && profiles && profiles.length === 0 && <div>Nenhum profile encontrado.</div>}
        {!loading && profiles && profiles.length > 0 && (
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(profiles, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
