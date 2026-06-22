ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS cep TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS street TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS neighborhood TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS complement TEXT DEFAULT '';

UPDATE public.clients
SET
  street = COALESCE(NULLIF(street, ''), address, ''),
  complement = COALESCE(NULLIF(complement, ''), secondary_address, '')
WHERE
  COALESCE(street, '') = ''
  OR COALESCE(complement, '') = '';
