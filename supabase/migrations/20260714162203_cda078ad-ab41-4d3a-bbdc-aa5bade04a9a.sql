
ALTER TABLE public.whatsapp_templates
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_templates_account_type_uniq
  ON public.whatsapp_templates(account_id, type)
  WHERE type IS NOT NULL;

DROP TRIGGER IF EXISTS whatsapp_templates_updated_at ON public.whatsapp_templates;
CREATE TRIGGER whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS reminder_24h_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_2h_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS appointments_date_time_idx
  ON public.appointments(date, time)
  WHERE status IS DISTINCT FROM 'cancelled';
