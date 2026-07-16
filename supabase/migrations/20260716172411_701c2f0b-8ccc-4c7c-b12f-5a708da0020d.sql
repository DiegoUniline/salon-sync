
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  description text,
  type text NOT NULL CHECK (type IN ('percentage','fixed')),
  value numeric NOT NULL CHECK (value >= 0),
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','service','product','category')),
  target_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  min_purchase numeric NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  usage_limit integer,
  times_used integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_select" ON public.promotions
  FOR SELECT TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "promotions_insert" ON public.promotions
  FOR INSERT TO authenticated
  WITH CHECK (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "promotions_update" ON public.promotions
  FOR UPDATE TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()))
  WITH CHECK (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "promotions_delete" ON public.promotions
  FOR DELETE TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE INDEX idx_promotions_account ON public.promotions(account_id);
CREATE INDEX idx_promotions_active ON public.promotions(account_id, is_active);
CREATE UNIQUE INDEX idx_promotions_code ON public.promotions(account_id, lower(code)) WHERE code IS NOT NULL;

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_promo_usage(p_promo_id uuid)
RETURNS public.promotions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
  v_row public.promotions;
BEGIN
  v_account_id := public.get_user_account_id(auth.uid());
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT * INTO v_row FROM public.promotions
    WHERE id = p_promo_id AND account_id = v_account_id
    FOR UPDATE;
  IF v_row.id IS NULL THEN RAISE EXCEPTION 'Promoción no encontrada'; END IF;
  IF NOT v_row.is_active THEN RAISE EXCEPTION 'Promoción inactiva'; END IF;
  IF v_row.end_date IS NOT NULL AND v_row.end_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Promoción vencida';
  END IF;
  IF v_row.start_date IS NOT NULL AND v_row.start_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Promoción aún no vigente';
  END IF;
  IF v_row.usage_limit IS NOT NULL AND v_row.times_used >= v_row.usage_limit THEN
    RAISE EXCEPTION 'Promoción sin usos disponibles';
  END IF;

  UPDATE public.promotions
    SET times_used = times_used + 1
    WHERE id = p_promo_id
    RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;
