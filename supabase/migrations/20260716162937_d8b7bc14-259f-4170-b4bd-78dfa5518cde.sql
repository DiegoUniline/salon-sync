
CREATE TABLE public.cash_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL,
  branch_id UUID,
  shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  user_id UUID,
  type TEXT NOT NULL CHECK (type IN ('withdrawal','deposit','expense','fund_change')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  reason TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cash_movements_account ON public.cash_movements(account_id);
CREATE INDEX idx_cash_movements_shift ON public.cash_movements(shift_id);
CREATE INDEX idx_cash_movements_branch ON public.cash_movements(branch_id);
CREATE INDEX idx_cash_movements_created ON public.cash_movements(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;
GRANT ALL ON public.cash_movements TO service_role;

ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cash_movements_select_own_account"
  ON public.cash_movements FOR SELECT
  TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "cash_movements_insert_own_account"
  ON public.cash_movements FOR INSERT
  TO authenticated
  WITH CHECK (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "cash_movements_update_own_account"
  ON public.cash_movements FOR UPDATE
  TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()))
  WITH CHECK (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "cash_movements_delete_own_account"
  ON public.cash_movements FOR DELETE
  TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE TRIGGER update_cash_movements_updated_at
  BEFORE UPDATE ON public.cash_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
