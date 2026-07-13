
CREATE OR REPLACE FUNCTION public.create_sale_atomic(p_sale jsonb)
RETURNS public.sales
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
  v_user_id uuid := auth.uid();
  v_branch_id uuid := NULLIF(p_sale->>'branch_id','')::uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty numeric;
  v_prev numeric;
  v_new numeric;
  v_sale public.sales;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;

  SELECT account_id INTO v_account_id FROM public.profiles WHERE user_id = v_user_id LIMIT 1;
  IF v_account_id IS NULL THEN RAISE EXCEPTION 'Usuario sin cuenta asociada'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_sale->'items','[]'::jsonb))
  LOOP
    IF COALESCE(v_item->>'type','') = 'product' AND (v_item->>'product_id') IS NOT NULL THEN
      v_product_id := (v_item->>'product_id')::uuid;
      v_qty := COALESCE((v_item->>'quantity')::numeric, 0);
      SELECT stock INTO v_prev FROM public.products
        WHERE id = v_product_id AND account_id = v_account_id FOR UPDATE;
      IF v_prev IS NULL THEN RAISE EXCEPTION 'Producto no encontrado: %', v_product_id; END IF;
      IF v_prev < v_qty THEN RAISE EXCEPTION 'Stock insuficiente (disponible %, solicitado %)', v_prev, v_qty; END IF;
    END IF;
  END LOOP;

  INSERT INTO public.sales (
    account_id, branch_id, client_id, employee_id, appointment_id,
    items, subtotal, discount, tax, total, payment_method, notes,
    sale_date, shift_id, folio, date, time, type, client_name,
    payments, commission, payment_status, client_phone
  ) VALUES (
    v_account_id, v_branch_id,
    NULLIF(p_sale->>'client_id','')::uuid,
    NULLIF(p_sale->>'employee_id','')::uuid,
    NULLIF(p_sale->>'appointment_id','')::uuid,
    COALESCE(p_sale->'items','[]'::jsonb),
    COALESCE((p_sale->>'subtotal')::numeric,0),
    COALESCE((p_sale->>'discount')::numeric,0),
    COALESCE((p_sale->>'tax')::numeric,0),
    COALESCE((p_sale->>'total')::numeric,0),
    p_sale->>'payment_method', p_sale->>'notes',
    COALESCE((p_sale->>'sale_date')::timestamptz, now()),
    NULLIF(p_sale->>'shift_id','')::uuid,
    p_sale->>'folio',
    COALESCE((p_sale->>'date')::date, CURRENT_DATE),
    p_sale->>'time',
    COALESCE(p_sale->>'type','sale'),
    p_sale->>'client_name',
    COALESCE(p_sale->'payments','[]'::jsonb),
    COALESCE((p_sale->>'commission')::numeric,0),
    COALESCE(p_sale->>'payment_status','paid'),
    p_sale->>'client_phone'
  ) RETURNING * INTO v_sale;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_sale->'items','[]'::jsonb))
  LOOP
    IF COALESCE(v_item->>'type','') = 'product' AND (v_item->>'product_id') IS NOT NULL THEN
      v_product_id := (v_item->>'product_id')::uuid;
      v_qty := COALESCE((v_item->>'quantity')::numeric, 0);
      SELECT stock INTO v_prev FROM public.products WHERE id = v_product_id FOR UPDATE;
      v_new := v_prev - v_qty;
      UPDATE public.products SET stock = v_new WHERE id = v_product_id;
      INSERT INTO public.inventory_movements (
        account_id, branch_id, product_id, type, quantity,
        previous_stock, new_stock, reason, user_id
      ) VALUES (
        v_account_id, v_branch_id, v_product_id, 'out', v_qty,
        v_prev, v_new, 'Venta ' || COALESCE(v_sale.folio, v_sale.id::text), v_user_id
      );
    END IF;
  END LOOP;

  RETURN v_sale;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_sale_atomic(jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.register_purchase_payment(
  p_purchase_id uuid, p_amount numeric,
  p_payment_method text DEFAULT 'cash', p_notes text DEFAULT NULL
)
RETURNS public.purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
  v_user_id uuid := auth.uid();
  v_purchase public.purchases;
  v_total_paid numeric;
  v_new_status text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT account_id INTO v_account_id FROM public.profiles WHERE user_id = v_user_id LIMIT 1;

  SELECT * INTO v_purchase FROM public.purchases
    WHERE id = p_purchase_id AND account_id = v_account_id FOR UPDATE;
  IF v_purchase.id IS NULL THEN RAISE EXCEPTION 'Compra no encontrada'; END IF;
  IF p_amount <= 0 THEN RAISE EXCEPTION 'El monto debe ser mayor a 0'; END IF;

  INSERT INTO public.purchase_payments (purchase_id, amount, payment_method, notes)
  VALUES (p_purchase_id, p_amount, p_payment_method, p_notes);

  SELECT COALESCE(SUM(amount),0) INTO v_total_paid FROM public.purchase_payments WHERE purchase_id = p_purchase_id;
  IF v_total_paid > v_purchase.total THEN
    RAISE EXCEPTION 'El pago total (%) excede el total de la compra (%)', v_total_paid, v_purchase.total;
  END IF;

  v_new_status := CASE WHEN v_total_paid >= v_purchase.total THEN 'paid' ELSE 'partial' END;
  UPDATE public.purchases SET amount_paid = v_total_paid, status = v_new_status
    WHERE id = p_purchase_id RETURNING * INTO v_purchase;

  RETURN v_purchase;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_purchase_payment(uuid, numeric, text, text) TO authenticated;
