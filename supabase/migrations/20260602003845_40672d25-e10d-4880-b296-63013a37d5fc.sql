CREATE TABLE public.budget_status_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  status_id uuid NOT NULL REFERENCES public.budget_statuses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (budget_id, status_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_status_assignments TO authenticated;
GRANT ALL ON public.budget_status_assignments TO service_role;

ALTER TABLE public.budget_status_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budget status assignments"
ON public.budget_status_assignments
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_budget_status_assignments_budget ON public.budget_status_assignments(budget_id);
CREATE INDEX idx_budget_status_assignments_status ON public.budget_status_assignments(status_id);

-- Migrar dados existentes
INSERT INTO public.budget_status_assignments (budget_id, status_id, user_id)
SELECT id, custom_status_id, user_id
FROM public.budgets
WHERE custom_status_id IS NOT NULL
ON CONFLICT DO NOTHING;