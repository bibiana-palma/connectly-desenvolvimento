WITH normalized_statuses AS (
  SELECT
    id,
    user_id,
    translate(
      lower(trim(name)),
      'áàâãäéèêëíìîïóòôõöúùûüç',
      'aaaaaeeeeiiiiooooouuuuc'
    ) AS normalized_name,
    first_value(id) OVER (
      PARTITION BY user_id,
      translate(
        lower(trim(name)),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc'
      )
      ORDER BY sort_order, created_at, id
    ) AS keep_id,
    row_number() OVER (
      PARTITION BY user_id,
      translate(
        lower(trim(name)),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc'
      )
      ORDER BY sort_order, created_at, id
    ) AS row_number
  FROM public.budget_statuses
),
duplicate_statuses AS (
  SELECT id AS duplicate_id, keep_id
  FROM normalized_statuses
  WHERE row_number > 1
)
DELETE FROM public.budget_status_assignments assignment
USING duplicate_statuses duplicate, public.budget_status_assignments kept_assignment
WHERE assignment.status_id = duplicate.duplicate_id
  AND kept_assignment.budget_id = assignment.budget_id
  AND kept_assignment.status_id = duplicate.keep_id;

WITH normalized_statuses AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY user_id,
      translate(
        lower(trim(name)),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc'
      )
      ORDER BY sort_order, created_at, id
    ) AS keep_id,
    row_number() OVER (
      PARTITION BY user_id,
      translate(
        lower(trim(name)),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc'
      )
      ORDER BY sort_order, created_at, id
    ) AS row_number
  FROM public.budget_statuses
),
duplicate_statuses AS (
  SELECT id AS duplicate_id, keep_id
  FROM normalized_statuses
  WHERE row_number > 1
)
UPDATE public.budget_status_assignments assignment
SET status_id = duplicate.keep_id
FROM duplicate_statuses duplicate
WHERE assignment.status_id = duplicate.duplicate_id;

WITH normalized_statuses AS (
  SELECT
    id,
    first_value(id) OVER (
      PARTITION BY user_id,
      translate(
        lower(trim(name)),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc'
      )
      ORDER BY sort_order, created_at, id
    ) AS keep_id,
    row_number() OVER (
      PARTITION BY user_id,
      translate(
        lower(trim(name)),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc'
      )
      ORDER BY sort_order, created_at, id
    ) AS row_number
  FROM public.budget_statuses
),
duplicate_statuses AS (
  SELECT id AS duplicate_id, keep_id
  FROM normalized_statuses
  WHERE row_number > 1
)
UPDATE public.budgets budget
SET custom_status_id = duplicate.keep_id
FROM duplicate_statuses duplicate
WHERE budget.custom_status_id = duplicate.duplicate_id;

WITH normalized_statuses AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id,
      translate(
        lower(trim(name)),
        'áàâãäéèêëíìîïóòôõöúùûüç',
        'aaaaaeeeeiiiiooooouuuuc'
      )
      ORDER BY sort_order, created_at, id
    ) AS row_number
  FROM public.budget_statuses
)
DELETE FROM public.budget_statuses status
USING normalized_statuses normalized
WHERE status.id = normalized.id
  AND normalized.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS budget_statuses_user_normalized_name_idx
ON public.budget_statuses (
  user_id,
  translate(
    lower(trim(name)),
    'áàâãäéèêëíìîïóòôõöúùûüç',
    'aaaaaeeeeiiiiooooouuuuc'
  )
);
