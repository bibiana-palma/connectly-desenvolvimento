import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/debug/statuses")({
  component: () => (
    <AppShell>
      <DebugStatuses />
    </AppShell>
  ),
});

function DebugStatuses() {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [sRes, aRes] = await Promise.all([
      supabase.from("budget_statuses").select("*").eq("user_id", user.id).order("sort_order").order("created_at"),
      supabase.from("budget_status_assignments").select("*").eq("user_id", user.id),
    ]);
    setStatuses(sRes.data || []);
    setAssignments(aRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="p-6">
        <h2 className="font-bold text-lg">Debug Statuses</h2>
        <p className="text-sm text-muted-foreground mt-2">Faça login para ver os dados de debug (mock por usuário).</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">Debug: Budget Statuses</h2>
        <div className="space-x-2">
          <button
            onClick={load}
            className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm"
            disabled={loading}
          >
            {loading ? "Carregando..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold">budget_statuses</h3>
        <pre className="mt-2 overflow-auto max-h-64 p-3 bg-card border border-border rounded">{JSON.stringify(statuses, null, 2)}</pre>
      </div>

      <div>
        <h3 className="font-semibold">budget_status_assignments</h3>
        <pre className="mt-2 overflow-auto max-h-64 p-3 bg-card border border-border rounded">{JSON.stringify(assignments, null, 2)}</pre>
      </div>
    </div>
  );
}
