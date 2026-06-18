CREATE OR REPLACE FUNCTION public.ensure_default_budget_statuses(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.budget_statuses
    WHERE user_id = target_user_id
    LIMIT 1
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.budget_statuses (user_id, name, color, sort_order)
  VALUES
    (target_user_id, 'Pago', '#1f3f96', 0),
    (target_user_id, 'Em aberto', '#3b82f6', 1),
    (target_user_id, 'Em producao', '#f5b400', 2),
    (target_user_id, 'Fechado p/ pagamento', '#e30613', 3);
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, company, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;

  PERFORM public.ensure_default_budget_statuses(NEW.id);

  RETURN NEW;
END;
$$;

SELECT public.ensure_default_budget_statuses(id)
FROM auth.users;
