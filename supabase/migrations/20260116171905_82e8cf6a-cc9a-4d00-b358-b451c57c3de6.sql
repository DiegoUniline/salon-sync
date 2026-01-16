
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'account_admin', 'branch_manager', 'employee');

-- Create enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'suspended', 'trial');

-- Subscription plans table (managed by super admin)
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_branches INTEGER NOT NULL DEFAULT 1,
    max_users INTEGER NOT NULL DEFAULT 5,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Accounts table (empresas/cuentas)
CREATE TABLE public.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Account subscriptions (suscripciones con fecha de vencimiento)
CREATE TABLE public.account_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
    status subscription_status DEFAULT 'trial',
    starts_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Branches table (sucursales por cuenta)
CREATE TABLE public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles table (usuarios vinculados a cuentas)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (roles separados para seguridad)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Clients table (clientes por cuenta)
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Services table (servicios por cuenta)
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Products table (productos por cuenta)
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    sku TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Appointments table (citas por sucursal)
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled',
    notes TEXT,
    total_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Function to get user's account_id
CREATE OR REPLACE FUNCTION public.get_user_account_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT account_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to check subscription status
CREATE OR REPLACE FUNCTION public.check_subscription_status(_account_id UUID)
RETURNS TABLE(is_valid BOOLEAN, days_remaining INTEGER, status subscription_status)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        CASE WHEN expires_at > now() THEN true ELSE false END as is_valid,
        EXTRACT(DAY FROM expires_at - now())::INTEGER as days_remaining,
        account_subscriptions.status
    FROM public.account_subscriptions
    WHERE account_id = _account_id
    ORDER BY expires_at DESC
    LIMIT 1
$$;

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (super_admin full access, others read)
CREATE POLICY "Super admins can manage plans" ON public.subscription_plans
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
    FOR SELECT TO authenticated
    USING (is_active = true);

-- RLS Policies for accounts
CREATE POLICY "Super admins can manage all accounts" ON public.accounts
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own account" ON public.accounts
    FOR SELECT TO authenticated
    USING (id = public.get_user_account_id(auth.uid()));

-- RLS Policies for account_subscriptions
CREATE POLICY "Super admins can manage subscriptions" ON public.account_subscriptions
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Account users can view their subscription" ON public.account_subscriptions
    FOR SELECT TO authenticated
    USING (account_id = public.get_user_account_id(auth.uid()));

-- RLS Policies for branches
CREATE POLICY "Super admins can manage all branches" ON public.branches
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Account admins can manage their branches" ON public.branches
    FOR ALL TO authenticated
    USING (account_id = public.get_user_account_id(auth.uid()) AND public.has_role(auth.uid(), 'account_admin'));

CREATE POLICY "Users can view their account branches" ON public.branches
    FOR SELECT TO authenticated
    USING (account_id = public.get_user_account_id(auth.uid()));

-- RLS Policies for profiles
CREATE POLICY "Super admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view/update own profile" ON public.profiles
    FOR ALL TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Account admins can view account profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (account_id = public.get_user_account_id(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- RLS Policies for clients
CREATE POLICY "Super admins can manage all clients" ON public.clients
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Account users can manage their clients" ON public.clients
    FOR ALL TO authenticated
    USING (account_id = public.get_user_account_id(auth.uid()));

-- RLS Policies for services
CREATE POLICY "Super admins can manage all services" ON public.services
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Account users can manage their services" ON public.services
    FOR ALL TO authenticated
    USING (account_id = public.get_user_account_id(auth.uid()));

-- RLS Policies for products
CREATE POLICY "Super admins can manage all products" ON public.products
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Account users can manage their products" ON public.products
    FOR ALL TO authenticated
    USING (account_id = public.get_user_account_id(auth.uid()));

-- RLS Policies for appointments
CREATE POLICY "Super admins can manage all appointments" ON public.appointments
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Branch users can manage their appointments" ON public.appointments
    FOR ALL TO authenticated
    USING (
        branch_id IN (
            SELECT id FROM public.branches 
            WHERE account_id = public.get_user_account_id(auth.uid())
        )
    );

-- Create indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_account_id ON public.profiles(account_id);
CREATE INDEX idx_branches_account_id ON public.branches(account_id);
CREATE INDEX idx_clients_account_id ON public.clients(account_id);
CREATE INDEX idx_services_account_id ON public.services(account_id);
CREATE INDEX idx_products_account_id ON public.products(account_id);
CREATE INDEX idx_appointments_branch_id ON public.appointments(branch_id);
CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX idx_account_subscriptions_account_id ON public.account_subscriptions(account_id);
CREATE INDEX idx_account_subscriptions_expires_at ON public.account_subscriptions(expires_at);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_account_subscriptions_updated_at BEFORE UPDATE ON public.account_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price, max_branches, max_users) VALUES
    ('Básico', 'Plan básico con 1 sucursal y 5 usuarios', 299.00, 1, 5),
    ('Profesional', 'Plan profesional con 3 sucursales y 15 usuarios', 599.00, 3, 15),
    ('Empresarial', 'Plan empresarial con sucursales y usuarios ilimitados', 999.00, 100, 100);
