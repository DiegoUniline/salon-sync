
-- Fix RLS policies: Change RESTRICTIVE to PERMISSIVE (OR logic instead of AND)
-- This is needed because restrictive policies require ALL to pass simultaneously

-- ACCOUNTS
DROP POLICY IF EXISTS "Super admins can manage all accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users can view their own account" ON public.accounts;

CREATE POLICY "Super admins can manage all accounts" ON public.accounts FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view their own account" ON public.accounts FOR SELECT USING (id = get_user_account_id(auth.uid()));
CREATE POLICY "Authenticated users can create accounts" ON public.accounts FOR INSERT TO authenticated WITH CHECK (true);

-- BRANCHES
DROP POLICY IF EXISTS "Super admins can manage all branches" ON public.branches;
DROP POLICY IF EXISTS "Account admins can manage their branches" ON public.branches;
DROP POLICY IF EXISTS "Users can view their account branches" ON public.branches;

CREATE POLICY "Super admins can manage all branches" ON public.branches FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account admins can manage their branches" ON public.branches FOR ALL USING (account_id = get_user_account_id(auth.uid()) AND has_role(auth.uid(), 'account_admin'::app_role));
CREATE POLICY "Users can view their account branches" ON public.branches FOR SELECT USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Authenticated users can create branches" ON public.branches FOR INSERT TO authenticated WITH CHECK (true);

-- PROFILES
DROP POLICY IF EXISTS "Super admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view/update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Account admins can view account profiles" ON public.profiles;

CREATE POLICY "Super admins can manage all profiles" ON public.profiles FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view/update own profile" ON public.profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Account admins can view account profiles" ON public.profiles FOR SELECT USING (account_id = get_user_account_id(auth.uid()));

-- USER_ROLES
DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Super admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Authenticated users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- CUSTOM_ROLES
DROP POLICY IF EXISTS "Account users can manage custom_roles" ON public.custom_roles;
DROP POLICY IF EXISTS "Super admins manage all custom_roles" ON public.custom_roles;

CREATE POLICY "Super admins manage all custom_roles" ON public.custom_roles FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage custom_roles" ON public.custom_roles FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Authenticated users can create custom_roles" ON public.custom_roles FOR INSERT TO authenticated WITH CHECK (true);

-- ACCOUNT_SUBSCRIPTIONS
DROP POLICY IF EXISTS "Super admins can manage subscriptions" ON public.account_subscriptions;
DROP POLICY IF EXISTS "Account users can view their subscription" ON public.account_subscriptions;

CREATE POLICY "Super admins can manage subscriptions" ON public.account_subscriptions FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can view their subscription" ON public.account_subscriptions FOR SELECT USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Authenticated users can create subscriptions" ON public.account_subscriptions FOR INSERT TO authenticated WITH CHECK (true);

-- SERVICES
DROP POLICY IF EXISTS "Account users can manage their services" ON public.services;
DROP POLICY IF EXISTS "Super admins can manage all services" ON public.services;

CREATE POLICY "Super admins can manage all services" ON public.services FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage their services" ON public.services FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- PRODUCTS
DROP POLICY IF EXISTS "Account users can manage their products" ON public.products;
DROP POLICY IF EXISTS "Super admins can manage all products" ON public.products;

CREATE POLICY "Super admins can manage all products" ON public.products FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage their products" ON public.products FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- CLIENTS
DROP POLICY IF EXISTS "Account users can manage their clients" ON public.clients;
DROP POLICY IF EXISTS "Super admins can manage all clients" ON public.clients;

CREATE POLICY "Super admins can manage all clients" ON public.clients FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage their clients" ON public.clients FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- APPOINTMENTS
DROP POLICY IF EXISTS "Branch users can manage their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Super admins can manage all appointments" ON public.appointments;

CREATE POLICY "Super admins can manage all appointments" ON public.appointments FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage their appointments" ON public.appointments FOR ALL USING (branch_id IN (SELECT id FROM branches WHERE account_id = get_user_account_id(auth.uid())));

-- SALES
DROP POLICY IF EXISTS "Account users can manage sales" ON public.sales;
DROP POLICY IF EXISTS "Super admins manage all sales" ON public.sales;

CREATE POLICY "Super admins manage all sales" ON public.sales FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage sales" ON public.sales FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- EXPENSES
DROP POLICY IF EXISTS "Account users can manage expenses" ON public.expenses;
DROP POLICY IF EXISTS "Super admins manage all expenses" ON public.expenses;

CREATE POLICY "Super admins manage all expenses" ON public.expenses FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage expenses" ON public.expenses FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- SUPPLIERS
DROP POLICY IF EXISTS "Account users can manage suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Super admins manage all suppliers" ON public.suppliers;

CREATE POLICY "Super admins manage all suppliers" ON public.suppliers FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage suppliers" ON public.suppliers FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- PURCHASES
DROP POLICY IF EXISTS "Account users can manage purchases" ON public.purchases;
DROP POLICY IF EXISTS "Super admins manage all purchases" ON public.purchases;

CREATE POLICY "Super admins manage all purchases" ON public.purchases FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage purchases" ON public.purchases FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- PURCHASE_PAYMENTS
DROP POLICY IF EXISTS "Account users can manage purchase_payments" ON public.purchase_payments;
DROP POLICY IF EXISTS "Super admins manage all purchase_payments" ON public.purchase_payments;

CREATE POLICY "Super admins manage all purchase_payments" ON public.purchase_payments FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage purchase_payments" ON public.purchase_payments FOR ALL USING (EXISTS (SELECT 1 FROM purchases p WHERE p.id = purchase_payments.purchase_id AND p.account_id = get_user_account_id(auth.uid())));

-- INVENTORY_MOVEMENTS
DROP POLICY IF EXISTS "Account users can manage inventory_movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Super admins manage all inventory_movements" ON public.inventory_movements;

CREATE POLICY "Super admins manage all inventory_movements" ON public.inventory_movements FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage inventory_movements" ON public.inventory_movements FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- SHIFTS
DROP POLICY IF EXISTS "Account users can manage shifts" ON public.shifts;
DROP POLICY IF EXISTS "Super admins manage all shifts" ON public.shifts;

CREATE POLICY "Super admins manage all shifts" ON public.shifts FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage shifts" ON public.shifts FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- CASH_CUTS
DROP POLICY IF EXISTS "Account users can manage cash_cuts" ON public.cash_cuts;
DROP POLICY IF EXISTS "Super admins manage all cash_cuts" ON public.cash_cuts;

CREATE POLICY "Super admins manage all cash_cuts" ON public.cash_cuts FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage cash_cuts" ON public.cash_cuts FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- SCHEDULES
DROP POLICY IF EXISTS "Account users can manage schedules" ON public.schedules;
DROP POLICY IF EXISTS "Super admins manage all schedules" ON public.schedules;

CREATE POLICY "Super admins manage all schedules" ON public.schedules FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage schedules" ON public.schedules FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- BLOCKED_DAYS
DROP POLICY IF EXISTS "Account users can manage blocked_days" ON public.blocked_days;
DROP POLICY IF EXISTS "Super admins manage all blocked_days" ON public.blocked_days;

CREATE POLICY "Super admins manage all blocked_days" ON public.blocked_days FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage blocked_days" ON public.blocked_days FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- CATEGORIES
DROP POLICY IF EXISTS "Account users can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Super admins manage all categories" ON public.categories;

CREATE POLICY "Super admins manage all categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Account users can manage categories" ON public.categories FOR ALL USING (account_id = get_user_account_id(auth.uid()));

-- SUBSCRIPTION_PLANS (public read)
DROP POLICY IF EXISTS "Anyone can view active plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Super admins can manage plans" ON public.subscription_plans;

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Super admins can manage plans" ON public.subscription_plans FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Also fix the handle_new_user trigger if it's missing
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
