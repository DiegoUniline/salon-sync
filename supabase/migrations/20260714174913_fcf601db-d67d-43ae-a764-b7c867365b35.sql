
-- ============================================================
-- 1) Trigger anti-escalación de privilegios en profiles
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Si es el service_role o super_admin/account_admin, permitir todo.
  v_is_admin := public.has_role(auth.uid(), 'super_admin')
             OR public.has_role(auth.uid(), 'account_admin');

  IF v_is_admin THEN
    RETURN NEW;
  END IF;

  -- Para usuarios normales editando su propio perfil, congelar campos sensibles.
  IF NEW.user_id = auth.uid() THEN
    NEW.permissions        := OLD.permissions;
    NEW.custom_role_id     := OLD.custom_role_id;
    NEW.commission_percent := OLD.commission_percent;
    NEW.is_active          := OLD.is_active;
    NEW.account_id         := OLD.account_id;
    NEW.branch_id          := OLD.branch_id;
    NEW.color              := OLD.color;
    NEW.hire_date          := OLD.hire_date;
    -- Permite: full_name, phone, avatar_url, email, notes, updated_at
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_profile_privilege_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_profile_privilege_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();


-- ============================================================
-- 2) Restringir creación de cuentas
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create accounts" ON public.accounts;

CREATE POLICY "Only users without account can create one"
  ON public.accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_account_id(auth.uid()) IS NULL
    OR public.has_role(auth.uid(), 'super_admin')
  );


-- ============================================================
-- 3) Eliminar auto-asignación de roles
-- ============================================================
DROP POLICY IF EXISTS "Users can self-assign only employee role" ON public.user_roles;

-- Los roles solo se asignan mediante:
--   - complete_signup (SECURITY DEFINER, se asigna account_admin al dueño)
--   - admin-create-user edge function (SECURITY DEFINER, valida rol del caller)
--   - super_admin manual


-- ============================================================
-- 4) Restringir INSERT de subscriptions al propio flujo de signup
-- ============================================================
DROP POLICY IF EXISTS "Users can create subscriptions for own account" ON public.account_subscriptions;
-- account_subscriptions se crea desde complete_signup (SECURITY DEFINER).
-- El super_admin puede crear/manipular vía su policy ALL.


-- ============================================================
-- 5) Revocar EXECUTE a anon en funciones SECURITY DEFINER internas
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role)            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_account_id(uuid)           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_subscription_status(uuid)     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.adjust_product_stock(uuid, numeric, text, text, uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.register_purchase_payment(uuid, numeric, text, text)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_sale_atomic(jsonb)           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_signup(text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_privilege_escalation() FROM PUBLIC, anon;

-- Garantizar acceso a authenticated y service_role
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role)            TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_account_id(uuid)           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_subscription_status(uuid)     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.adjust_product_stock(uuid, numeric, text, text, uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_purchase_payment(uuid, numeric, text, text)        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_sale_atomic(jsonb)           TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.complete_signup(text, text, text, text, text) TO authenticated, service_role;
