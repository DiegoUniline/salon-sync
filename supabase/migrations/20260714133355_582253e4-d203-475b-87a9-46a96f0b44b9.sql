
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  user_id uuid,
  user_name text,
  action text NOT NULL,
  entity_table text NOT NULL,
  entity_id uuid,
  summary text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_account ON public.audit_logs(account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_table, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_own_account" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid()));

CREATE POLICY "audit_logs_insert_own_account" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (account_id = public.get_user_account_id(auth.uid()));
