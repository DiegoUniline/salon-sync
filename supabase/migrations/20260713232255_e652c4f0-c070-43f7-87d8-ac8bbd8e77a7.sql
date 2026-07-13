
CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_product_id uuid,
  p_delta numeric,
  p_type text,
  p_reason text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL,
  p_branch_id uuid DEFAULT NULL
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_account_id uuid;
  v_prev numeric;
  v_new numeric;
  v_product public.products;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT account_id INTO v_account_id FROM public.profiles WHERE user_id = v_user_id LIMIT 1;
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'Usuario sin cuenta'; END IF;

  SELECT stock INTO v_prev FROM public.products
    WHERE id = p_product_id AND account_id = v_account_id FOR UPDATE;
  IF v_prev IS NULL THEN RAISE EXCEPTION 'Producto no encontrado'; END IF;

  v_new := v_prev + p_delta;
  IF v_new < 0 THEN RAISE EXCEPTION 'Stock insuficiente (disponible %, cambio %)', v_prev, p_delta; END IF;

  UPDATE public.products SET stock = v_new WHERE id = p_product_id RETURNING * INTO v_product;

  INSERT INTO public.inventory_movements (
    account_id, branch_id, product_id, type, quantity,
    previous_stock, new_stock, reason, user_id, reference_id
  ) VALUES (
    v_account_id, p_branch_id, p_product_id, p_type, ABS(p_delta),
    v_prev, v_new, p_reason, v_user_id, p_reference_id
  );

  RETURN v_product;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_product_stock(uuid, numeric, text, text, uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_product_stock(uuid, numeric, text, text, uuid, uuid) FROM anon, public;
