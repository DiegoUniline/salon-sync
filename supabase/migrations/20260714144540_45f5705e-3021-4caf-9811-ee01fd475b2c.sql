
-- Fix branches insert: restrict to user's own account
DROP POLICY IF EXISTS "Authenticated users can create branches" ON public.branches;
CREATE POLICY "Users can create branches in their account"
ON public.branches FOR INSERT TO authenticated
WITH CHECK (account_id = public.get_user_account_id(auth.uid()));

-- Fix user_roles insert: prevent self-assigning privileged roles
DROP POLICY IF EXISTS "Authenticated users can insert own role" ON public.user_roles;
CREATE POLICY "Users can self-assign only non-privileged roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role NOT IN ('super_admin'::app_role, 'account_admin'::app_role)
);
