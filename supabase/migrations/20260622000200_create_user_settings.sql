CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT DEFAULT '',
  company_document TEXT DEFAULT '',
  company_email TEXT DEFAULT '',
  company_phone TEXT DEFAULT '',
  company_address TEXT DEFAULT '',
  default_freight NUMERIC(12,2) NOT NULL DEFAULT 0,
  quote_validity_days INTEGER NOT NULL DEFAULT 7,
  default_budget_notes TEXT DEFAULT '',
  theme TEXT NOT NULL DEFAULT 'light',
  show_inactive_products BOOLEAN NOT NULL DEFAULT true,
  require_client_document BOOLEAN NOT NULL DEFAULT false,
  require_client_phone BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own settings"
ON public.user_settings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
