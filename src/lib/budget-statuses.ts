import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_BUDGET_STATUSES = [
  { name: "Pago", color: "#1f3f96", sort_order: 0 },
  { name: "Em aberto", color: "#3b82f6", sort_order: 1 },
  { name: "Em producao", color: "#f5b400", sort_order: 2 },
  { name: "Fechado p/ pagamento", color: "#e30613", sort_order: 3 },
] as const;

export type BudgetStatus = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

const pendingEnsures = new Map<string, Promise<void>>();

export async function ensureDefaultBudgetStatuses(userId: string) {
  const pending = pendingEnsures.get(userId);
  if (pending) return pending;

  const promise = ensureDefaultBudgetStatusesOnce(userId).finally(() => {
    pendingEnsures.delete(userId);
  });
  pendingEnsures.set(userId, promise);
  return promise;
}

async function ensureDefaultBudgetStatusesOnce(userId: string) {
  const { data: existing, error: selectError } = await supabase
    .from("budget_statuses")
    .select("id,name")
    .eq("user_id", userId);

  if (selectError) {
    console.error("Erro ao buscar status padrao", selectError);
    return;
  }

  if (existing && existing.length > 0) return;

  const { error: insertError } = await supabase.from("budget_statuses").insert(
    DEFAULT_BUDGET_STATUSES.map((status) => ({
      ...status,
      user_id: userId,
    })),
  );

  if (insertError) console.error("Erro ao criar status padrao", insertError);
}

export async function loadBudgetStatuses(userId: string) {
  await ensureDefaultBudgetStatuses(userId);

  const { data, error } = await supabase
    .from("budget_statuses")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order")
    .order("created_at");

  if (error) throw error;
  return uniqueStatuses((data || []) as BudgetStatus[]);
}

function uniqueStatuses(statuses: BudgetStatus[]) {
  const seen = new Set<string>();

  return statuses.filter((status) => {
    const key = normalizeStatusName(status.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeStatusName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
