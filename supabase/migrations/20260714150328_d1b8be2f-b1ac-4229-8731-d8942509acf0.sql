-- Prevent users from changing sensitive profile fields directly
DROP POLICY IF EXISTS "Users can view/update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update safe own profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND account_id = public.get_user_account_id(auth.uid())
);

REVOKE UPDATE ON public.profiles FROM anon;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, avatar_url, color, notes, hire_date, commission_percent, is_active, updated_at)
ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Complete signup in a trusted database function so account_id/branch_id/admin role are assigned atomically
CREATE OR REPLACE FUNCTION public.complete_signup(
  p_account_name text,
  p_branch_name text,
  p_admin_name text,
  p_admin_phone text DEFAULT NULL,
  p_plan_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_profile public.profiles;
  v_account public.accounts;
  v_branch public.branches;
  v_plan_id uuid;
  v_trial_end timestamptz := now() + interval '14 days';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_profile.id IS NULL THEN
    INSERT INTO public.profiles (user_id, full_name, email)
    VALUES (v_user_id, COALESCE(NULLIF(p_admin_name, ''), v_user_email), v_user_email)
    RETURNING * INTO v_profile;
  END IF;

  IF v_profile.account_id IS NOT NULL THEN
    SELECT * INTO v_account FROM public.accounts WHERE id = v_profile.account_id;
    SELECT * INTO v_branch FROM public.branches WHERE id = v_profile.branch_id;
    RETURN jsonb_build_object(
      'profile_id', v_profile.id,
      'account_id', v_profile.account_id,
      'branch_id', v_profile.branch_id,
      'already_completed', true
    );
  END IF;

  INSERT INTO public.accounts (name, email, phone)
  VALUES (NULLIF(p_account_name, ''), COALESCE(v_user_email, ''), NULLIF(p_admin_phone, ''))
  RETURNING * INTO v_account;

  INSERT INTO public.branches (account_id, name, is_main)
  VALUES (v_account.id, NULLIF(p_branch_name, ''), true)
  RETURNING * INTO v_branch;

  UPDATE public.profiles
  SET account_id = v_account.id,
      branch_id = v_branch.id,
      full_name = COALESCE(NULLIF(p_admin_name, ''), full_name),
      phone = NULLIF(p_admin_phone, ''),
      updated_at = now()
  WHERE id = v_profile.id
  RETURNING * INTO v_profile;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'account_admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF p_plan_id IS NOT NULL AND p_plan_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_plan_id := p_plan_id::uuid;
  END IF;

  IF v_plan_id IS NULL THEN
    SELECT id INTO v_plan_id
    FROM public.subscription_plans
    WHERE is_active = true
    ORDER BY price ASC
    LIMIT 1;
  END IF;

  IF v_plan_id IS NOT NULL THEN
    INSERT INTO public.account_subscriptions (account_id, plan_id, status, expires_at)
    VALUES (v_account.id, v_plan_id, 'trial', v_trial_end);
  END IF;

  INSERT INTO public.custom_roles (account_id, name, description, color, is_system, permissions)
  VALUES
    (v_account.id, 'Administrador', 'Acceso total al sistema', '#EF4444', true, '{}'::jsonb),
    (v_account.id, 'Recepcionista', 'Gestión de citas y clientes', '#3B82F6', true, '{}'::jsonb),
    (v_account.id, 'Estilista', 'Ver agenda y registrar servicios', '#10B981', true, '{}'::jsonb);

  RETURN jsonb_build_object(
    'profile_id', v_profile.id,
    'account_id', v_account.id,
    'branch_id', v_branch.id,
    'already_completed', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_signup(text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.complete_signup(text, text, text, text, text) TO authenticated;

-- Keep direct role self-assignment limited to non-privileged roles
DROP POLICY IF EXISTS "Users can self-assign only non-privileged roles" ON public.user_roles;
CREATE POLICY "Users can self-assign only employee role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND role = 'employee'::app_role);