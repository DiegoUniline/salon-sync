
ALTER TABLE public.blocked_days
  ADD COLUMN IF NOT EXISTS start_time time NULL,
  ADD COLUMN IF NOT EXISTS end_time   time NULL;

-- Índice compuesto para consultas por rango de fecha + cuenta
CREATE INDEX IF NOT EXISTS idx_blocked_days_account_dates
  ON public.blocked_days (account_id, start_date, end_date);

-- Regla: si se define una hora, deben definirse ambas y start < end
CREATE OR REPLACE FUNCTION public.validate_blocked_time_range()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.start_time IS NULL) <> (NEW.end_time IS NULL) THEN
    RAISE EXCEPTION 'start_time y end_time deben ir juntos (ambos definidos u omitidos)';
  END IF;
  IF NEW.start_time IS NOT NULL AND NEW.start_time >= NEW.end_time THEN
    RAISE EXCEPTION 'start_time debe ser menor que end_time';
  END IF;
  IF NEW.start_date > NEW.end_date THEN
    RAISE EXCEPTION 'start_date no puede ser posterior a end_date';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_blocked_time_range ON public.blocked_days;
CREATE TRIGGER trg_validate_blocked_time_range
  BEFORE INSERT OR UPDATE ON public.blocked_days
  FOR EACH ROW EXECUTE FUNCTION public.validate_blocked_time_range();

REVOKE EXECUTE ON FUNCTION public.validate_blocked_time_range() FROM PUBLIC, anon;
