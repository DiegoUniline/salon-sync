ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS tip_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tip_employee_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tips jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_sales_tip_employee_id ON public.sales(tip_employee_id) WHERE tip_employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sales_account_date ON public.sales(account_id, date);