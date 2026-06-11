
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS budget_number integer;

-- Backfill existing rows per user, ordered by created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) AS rn
  FROM public.budgets
  WHERE budget_number IS NULL
)
UPDATE public.budgets b
SET budget_number = n.rn
FROM numbered n
WHERE b.id = n.id;

CREATE OR REPLACE FUNCTION public.set_budget_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.budget_number IS NULL THEN
    SELECT COALESCE(MAX(budget_number), 0) + 1
    INTO NEW.budget_number
    FROM public.budgets
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_budget_number ON public.budgets;
CREATE TRIGGER trg_set_budget_number
BEFORE INSERT ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.set_budget_number();
