
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  instance_name text NOT NULL UNIQUE,
  phone_number text,
  status text NOT NULL DEFAULT 'disconnected',
  qr_code text,
  webhook_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wa_instances_account ON public.whatsapp_instances(account_id);

CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  remote_jid text NOT NULL,
  contact_name text,
  contact_phone text,
  client_id uuid,
  assigned_to uuid,
  last_message text,
  last_message_at timestamptz,
  unread_count integer NOT NULL DEFAULT 0,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, remote_jid)
);
CREATE INDEX idx_wa_conv_account ON public.whatsapp_conversations(account_id, last_message_at DESC);
CREATE INDEX idx_wa_conv_client ON public.whatsapp_conversations(client_id);

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  message_id text UNIQUE,
  from_me boolean NOT NULL DEFAULT false,
  message_type text NOT NULL DEFAULT 'text',
  content text,
  media_url text,
  media_mime text,
  status text NOT NULL DEFAULT 'received',
  sender_user_id uuid,
  timestamp timestamptz NOT NULL DEFAULT now(),
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wa_msg_conv ON public.whatsapp_messages(conversation_id, timestamp DESC);
CREATE INDEX idx_wa_msg_account ON public.whatsapp_messages(account_id, timestamp DESC);

CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  name text NOT NULL,
  content text NOT NULL,
  shortcut text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_wa_tpl_account ON public.whatsapp_templates(account_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_instances TO authenticated;
GRANT ALL ON public.whatsapp_instances TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_instances_own_account" ON public.whatsapp_instances FOR ALL TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid())) WITH CHECK (account_id = public.get_user_account_id(auth.uid()));
CREATE POLICY "wa_conv_own_account" ON public.whatsapp_conversations FOR ALL TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid())) WITH CHECK (account_id = public.get_user_account_id(auth.uid()));
CREATE POLICY "wa_msg_own_account" ON public.whatsapp_messages FOR ALL TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid())) WITH CHECK (account_id = public.get_user_account_id(auth.uid()));
CREATE POLICY "wa_tpl_own_account" ON public.whatsapp_templates FOR ALL TO authenticated
  USING (account_id = public.get_user_account_id(auth.uid())) WITH CHECK (account_id = public.get_user_account_id(auth.uid()));

CREATE TRIGGER trg_wa_instances_updated BEFORE UPDATE ON public.whatsapp_instances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_wa_conv_updated BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_instances;
