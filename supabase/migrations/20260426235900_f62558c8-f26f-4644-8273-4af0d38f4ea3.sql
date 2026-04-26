-- Create custom budget statuses table
CREATE TABLE public.budget_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own budget statuses"
ON public.budget_statuses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_budget_statuses_updated_at
BEFORE UPDATE ON public.budget_statuses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Add custom_status_id column to budgets so users can use custom statuses
ALTER TABLE public.budgets
ADD COLUMN custom_status_id UUID REFERENCES public.budget_statuses(id) ON DELETE SET NULL;