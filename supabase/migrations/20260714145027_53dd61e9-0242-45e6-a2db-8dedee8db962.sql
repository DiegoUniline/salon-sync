
DROP POLICY IF EXISTS "Authenticated users can create subscriptions" ON public.account_subscriptions;
CREATE POLICY "Users can create subscriptions for own account"
ON public.account_subscriptions FOR INSERT TO authenticated
WITH CHECK (account_id = public.get_user_account_id(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can create custom_roles" ON public.custom_roles;
CREATE POLICY "Users can create custom_roles for own account"
ON public.custom_roles FOR INSERT TO authenticated
WITH CHECK (account_id = public.get_user_account_id(auth.uid()));
