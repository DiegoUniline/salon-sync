
-- FK / RLS filter indexes
CREATE INDEX IF NOT EXISTS idx_account_subscriptions_plan_id ON public.account_subscriptions(plan_id);

CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_employee_id ON public.appointments(employee_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_stylist_id ON public.appointments(stylist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_account_date ON public.appointments(account_id, date);

CREATE INDEX IF NOT EXISTS idx_blocked_days_account_id ON public.blocked_days(account_id);
CREATE INDEX IF NOT EXISTS idx_blocked_days_target_id ON public.blocked_days(target_id);

CREATE INDEX IF NOT EXISTS idx_cash_cuts_account_id ON public.cash_cuts(account_id);
CREATE INDEX IF NOT EXISTS idx_cash_cuts_branch_id ON public.cash_cuts(branch_id);
CREATE INDEX IF NOT EXISTS idx_cash_cuts_shift_id ON public.cash_cuts(shift_id);
CREATE INDEX IF NOT EXISTS idx_cash_cuts_user_id ON public.cash_cuts(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_account_id ON public.categories(account_id);

CREATE INDEX IF NOT EXISTS idx_custom_roles_account_id ON public.custom_roles(account_id);

CREATE INDEX IF NOT EXISTS idx_expenses_account_id ON public.expenses(account_id);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON public.expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON public.expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);

CREATE INDEX IF NOT EXISTS idx_inv_movements_account_id ON public.inventory_movements(account_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_branch_id ON public.inventory_movements(branch_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_reference_id ON public.inventory_movements(reference_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_user_id ON public.inventory_movements(user_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_custom_role_id ON public.profiles(custom_role_id);

CREATE INDEX IF NOT EXISTS idx_purchase_payments_purchase_id ON public.purchase_payments(purchase_id);

CREATE INDEX IF NOT EXISTS idx_purchases_account_id ON public.purchases(account_id);
CREATE INDEX IF NOT EXISTS idx_purchases_branch_id ON public.purchases(branch_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id ON public.purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_sales_account_id ON public.sales(account_id);
CREATE INDEX IF NOT EXISTS idx_sales_branch_id ON public.sales(branch_id);
CREATE INDEX IF NOT EXISTS idx_sales_client_id ON public.sales(client_id);
CREATE INDEX IF NOT EXISTS idx_sales_employee_id ON public.sales(employee_id);
CREATE INDEX IF NOT EXISTS idx_sales_appointment_id ON public.sales(appointment_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_account_date ON public.sales(account_id, date);

CREATE INDEX IF NOT EXISTS idx_schedules_account_id ON public.schedules(account_id);
CREATE INDEX IF NOT EXISTS idx_schedules_target_id ON public.schedules(target_id);

CREATE INDEX IF NOT EXISTS idx_services_category_id ON public.services(category_id);

CREATE INDEX IF NOT EXISTS idx_shifts_account_id ON public.shifts(account_id);
CREATE INDEX IF NOT EXISTS idx_shifts_branch_id ON public.shifts(branch_id);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON public.shifts(user_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_account_id ON public.suppliers(account_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

ANALYZE;
