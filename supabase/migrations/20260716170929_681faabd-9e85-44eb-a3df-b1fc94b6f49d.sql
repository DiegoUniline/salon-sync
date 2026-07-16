
-- Fase 3: Pagos de comisiones y propinas a empleados
CREATE TABLE public.commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  branch_id uuid,
  employee_id uuid NOT NULL,
  employee_name text,
  period_from date NOT NULL,
  period_to date NOT NULL,
  commission_amount numeric NOT NULL DEFAULT 0,
  tips_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  folio text,
  notes text,
  sales_included jsonb NOT NULL DEFAULT '[]'::jsonb,
  paid_by uuid,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_payments TO authenticated;
GRANT ALL ON public.commission_payments TO service_role;

ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commission_payments_select" ON public.commission_payments
  FOR SELECT TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "commission_payments_insert" ON public.commission_payments
  FOR INSERT TO authenticated
  WITH CHECK (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "commission_payments_update" ON public.commission_payments
  FOR UPDATE TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()))
  WITH CHECK (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "commission_payments_delete" ON public.commission_payments
  FOR DELETE TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE INDEX idx_commission_payments_account ON public.commission_payments(account_id);
CREATE INDEX idx_commission_payments_employee ON public.commission_payments(employee_id);
CREATE INDEX idx_commission_payments_period ON public.commission_payments(account_id, period_from, period_to);

CREATE TRIGGER commission_payments_updated_at
  BEFORE UPDATE ON public.commission_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC atómica para registrar pago
CREATE OR REPLACE FUNCTION public.register_commission_payment(
  p_employee_id uuid,
  p_employee_name text,
  p_period_from date,
  p_period_to date,
  p_commission_amount numeric,
  p_tips_amount numeric,
  p_payment_method text DEFAULT 'cash',
  p_notes text DEFAULT NULL,
  p_sales_included jsonb DEFAULT '[]'::jsonb,
  p_branch_id uuid DEFAULT NULL
)
RETURNS public.commission_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_account_id uuid;
  v_folio text;
  v_row public.commission_payments;
  v_total numeric;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT account_id INTO v_account_id FROM public.profiles WHERE user_id = v_user_id LIMIT 1;
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'Usuario sin cuenta'; END IF;

  v_total := COALESCE(p_commission_amount,0) + COALESCE(p_tips_amount,0);
  IF v_total <= 0 THEN RAISE EXCEPTION 'El monto a pagar debe ser mayor a 0'; END IF;

  v_folio := 'PAGO-' || to_char(now(), 'YYYYMMDD-HH24MISS');

  INSERT INTO public.commission_payments(
    account_id, branch_id, employee_id, employee_name,
    period_from, period_to, commission_amount, tips_amount, total,
    payment_method, folio, notes, sales_included, paid_by
  ) VALUES (
    v_account_id, p_branch_id, p_employee_id, p_employee_name,
    p_period_from, p_period_to,
    COALESCE(p_commission_amount,0), COALESCE(p_tips_amount,0), v_total,
    COALESCE(p_payment_method,'cash'), v_folio, p_notes, COALESCE(p_sales_included,'[]'::jsonb), v_user_id
  ) RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;
