
-- Normalize existing codes and enforce case-insensitive uniqueness per account
UPDATE public.promotions
   SET code = UPPER(TRIM(code))
 WHERE code IS NOT NULL AND code <> UPPER(TRIM(code));

-- Deduplicate: if the same normalized code exists twice in the same account,
-- keep the oldest one and suffix the rest so the unique index can be created.
WITH ranked AS (
  SELECT id, account_id, code,
         ROW_NUMBER() OVER (PARTITION BY account_id, UPPER(TRIM(code)) ORDER BY created_at) AS rn
    FROM public.promotions
   WHERE code IS NOT NULL
)
UPDATE public.promotions p
   SET code = p.code || '-' || r.rn::text
  FROM ranked r
 WHERE r.id = p.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS promotions_account_code_ci_uidx
  ON public.promotions (account_id, UPPER(TRIM(code)))
  WHERE code IS NOT NULL;
