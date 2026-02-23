
-- ============================================
-- CATEGORIES (for services and products)
-- ============================================
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('service', 'product')),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage categories" ON public.categories FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Add category_id to services and products
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- ============================================
-- CUSTOM ROLES (app-level with granular permissions)
-- ============================================
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#3B82F6',
  is_system boolean DEFAULT false,
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage custom_roles" ON public.custom_roles FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all custom_roles" ON public.custom_roles FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Add custom_role_id and permissions to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS custom_role_id uuid REFERENCES public.custom_roles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS color text DEFAULT '#3B82F6';

-- ============================================
-- SUPPLIERS (Proveedores)
-- ============================================
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage suppliers" ON public.suppliers FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all suppliers" ON public.suppliers FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- SALES (Ventas)
-- ============================================
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  items jsonb DEFAULT '[]',
  subtotal numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  payment_method text DEFAULT 'cash',
  notes text,
  sale_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage sales" ON public.sales FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all sales" ON public.sales FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- EXPENSES (Gastos)
-- ============================================
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  category text DEFAULT 'general',
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash',
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  receipt_url text,
  expense_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage expenses" ON public.expenses FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all expenses" ON public.expenses FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- PURCHASES (Compras)
-- ============================================
CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  items jsonb DEFAULT '[]',
  subtotal numeric DEFAULT 0,
  tax numeric DEFAULT 0,
  total numeric DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'cancelled')),
  notes text,
  purchase_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage purchases" ON public.purchases FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all purchases" ON public.purchases FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- Purchase payments
CREATE TABLE public.purchase_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text DEFAULT 'cash',
  notes text,
  payment_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.purchase_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage purchase_payments" ON public.purchase_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.purchases p WHERE p.id = purchase_id AND p.account_id = get_user_account_id(auth.uid()))
);
CREATE POLICY "Super admins manage all purchase_payments" ON public.purchase_payments FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- INVENTORY MOVEMENTS
-- ============================================
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'sale', 'purchase')),
  quantity integer NOT NULL,
  previous_stock integer DEFAULT 0,
  new_stock integer DEFAULT 0,
  reference_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage inventory_movements" ON public.inventory_movements FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all inventory_movements" ON public.inventory_movements FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- SHIFTS (Turnos)
-- ============================================
CREATE TABLE public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  initial_cash numeric DEFAULT 0,
  final_cash numeric,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage shifts" ON public.shifts FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all shifts" ON public.shifts FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- CASH CUTS (Cortes de caja)
-- ============================================
CREATE TABLE public.cash_cuts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  expected_cash numeric DEFAULT 0,
  actual_cash numeric DEFAULT 0,
  difference numeric DEFAULT 0,
  total_sales numeric DEFAULT 0,
  total_expenses numeric DEFAULT 0,
  total_cash numeric DEFAULT 0,
  total_card numeric DEFAULT 0,
  total_transfer numeric DEFAULT 0,
  notes text,
  cut_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.cash_cuts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage cash_cuts" ON public.cash_cuts FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all cash_cuts" ON public.cash_cuts FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- SCHEDULES (Horarios)
-- ============================================
CREATE TABLE public.schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('branch', 'employee')),
  target_id uuid NOT NULL,
  schedule jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage schedules" ON public.schedules FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all schedules" ON public.schedules FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- BLOCKED DAYS (Días bloqueados)
-- ============================================
CREATE TABLE public.blocked_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('all', 'branch', 'employee')),
  target_id uuid,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.blocked_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Account users can manage blocked_days" ON public.blocked_days FOR ALL USING (account_id = get_user_account_id(auth.uid()));
CREATE POLICY "Super admins manage all blocked_days" ON public.blocked_days FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGERS: Updated_at
-- ============================================
CREATE TRIGGER update_custom_roles_updated_at BEFORE UPDATE ON public.custom_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
