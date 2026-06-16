
-- APPOINTMENTS: columnas usadas por Citas.tsx / AppointmentFormDialog / AppointmentEditorDialog
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS date date,
  ADD COLUMN IF NOT EXISTS time text,
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS stylist_id uuid,
  ADD COLUMN IF NOT EXISTS services jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS products jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS payments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_appointments_account_id ON public.appointments(account_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);

-- SALES: columnas usadas por Ventas.tsx
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS folio text,
  ADD COLUMN IF NOT EXISTS date date,
  ADD COLUMN IF NOT EXISTS time text,
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS payments jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_sales_shift_id ON public.sales(shift_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);

-- PURCHASES: campos opcionales que el código puede registrar
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS folio text,
  ADD COLUMN IF NOT EXISTS payments jsonb NOT NULL DEFAULT '[]'::jsonb;
