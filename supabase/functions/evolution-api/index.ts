// Proxy autenticado hacia Evolution API self-hosted
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const EVOLUTION_URL = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';
const WEBHOOK_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-webhook`;

const sbAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function evo(path: string, init: RequestInit = {}) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) throw new Error('EVOLUTION_API_URL / EVOLUTION_API_KEY no configurados');
  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    ...init,
    headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json', ...(init.headers || {}) },
  });
  const text = await res.text();
  let body: any = text;
  try { body = JSON.parse(text); } catch {}
  if (!res.ok) throw new Error(`Evolution API ${res.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  return body;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.slice(7);
    const { data: userData, error: authErr } = await sbAdmin.auth.getUser(token);
    if (authErr || !userData.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const userId = userData.user.id;
    const { data: profile } = await sbAdmin.from('profiles').select('account_id').eq('user_id', userId).maybeSingle();
    if (!profile?.account_id) return new Response(JSON.stringify({ error: 'No account' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const accountId = profile.account_id;

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    if (action === 'create_instance') {
      const instanceName = `salon_${accountId.replace(/-/g, '').slice(0, 12)}`;
      await sbAdmin.from('whatsapp_instances').upsert({
        account_id: accountId, instance_name: instanceName, status: 'connecting', webhook_url: WEBHOOK_URL,
      }, { onConflict: 'instance_name' });
      try {
        await evo('/instance/create', {
          method: 'POST',
          body: JSON.stringify({
            instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS',
            webhook: { url: WEBHOOK_URL, byEvents: false,
              events: ['QRCODE_UPDATED', 'MESSAGES_UPSERT', 'CONNECTION_UPDATE', 'SEND_MESSAGE'] },
          }),
        });
      } catch (e: any) { if (!/already|exists/i.test(e.message)) console.warn('create warn:', e.message); }
      const qrRes = await evo(`/instance/connect/${instanceName}`).catch(() => null);
      const qr = qrRes?.base64 || qrRes?.qrcode?.base64 || null;
      if (qr) await sbAdmin.from('whatsapp_instances').update({ qr_code: qr, status: 'connecting' }).eq('instance_name', instanceName);
      return new Response(JSON.stringify({ ok: true, instance_name: instanceName, qr }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'status') {
      const { data: inst } = await sbAdmin.from('whatsapp_instances').select('*').eq('account_id', accountId).maybeSingle();
      if (!inst) return new Response(JSON.stringify({ status: 'none' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const state = await evo(`/instance/connectionState/${inst.instance_name}`).catch(() => null);
      const st = state?.instance?.state || state?.state || null;
      const status = st === 'open' ? 'connected' : (st === 'connecting' ? 'connecting' : 'disconnected');
      await sbAdmin.from('whatsapp_instances').update({ status }).eq('id', inst.id);
      return new Response(JSON.stringify({ status, instance: inst.instance_name }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'logout') {
      const { data: inst } = await sbAdmin.from('whatsapp_instances').select('*').eq('account_id', accountId).maybeSingle();
      if (inst) {
        await evo(`/instance/logout/${inst.instance_name}`, { method: 'DELETE' }).catch(() => null);
        await sbAdmin.from('whatsapp_instances').update({ status: 'disconnected', qr_code: null }).eq('id', inst.id);
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'send_message') {
      const { conversation_id, text } = body;
      if (!conversation_id || !text) return new Response(JSON.stringify({ error: 'missing params' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { data: conv } = await sbAdmin.from('whatsapp_conversations').select('*, whatsapp_instances(instance_name)').eq('id', conversation_id).eq('account_id', accountId).maybeSingle();
      if (!conv) return new Response(JSON.stringify({ error: 'conversation not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const instanceName = (conv as any).whatsapp_instances?.instance_name;
      if (!instanceName) return new Response(JSON.stringify({ error: 'no instance' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const result = await evo(`/message/sendText/${instanceName}`, {
        method: 'POST', body: JSON.stringify({ number: conv.remote_jid.split('@')[0], text }),
      });
      await sbAdmin.from('whatsapp_messages').insert({
        account_id: accountId, conversation_id, instance_id: conv.instance_id,
        message_id: result?.key?.id || null, from_me: true, message_type: 'text', content: text,
        status: 'sent', sender_user_id: userId, timestamp: new Date().toISOString(), raw: result,
      });
      await sbAdmin.from('whatsapp_conversations').update({
        last_message: text, last_message_at: new Date().toISOString(), unread_count: 0,
      }).eq('id', conversation_id);
      return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'start_conversation') {
      const { phone, initial_message } = body;
      if (!phone) return new Response(JSON.stringify({ error: 'phone required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { data: inst } = await sbAdmin.from('whatsapp_instances').select('*').eq('account_id', accountId).maybeSingle();
      if (!inst) return new Response(JSON.stringify({ error: 'no instance' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const cleanPhone = String(phone).replace(/\D/g, '');
      const remoteJid = `${cleanPhone}@s.whatsapp.net`;
      const { data: conv } = await sbAdmin.from('whatsapp_conversations').upsert({
        account_id: accountId, instance_id: inst.id, remote_jid: remoteJid,
        contact_phone: cleanPhone, contact_name: cleanPhone,
        last_message: initial_message || '', last_message_at: new Date().toISOString(),
      }, { onConflict: 'account_id,remote_jid' }).select().single();
      if (initial_message) {
        await evo(`/message/sendText/${inst.instance_name}`, {
          method: 'POST', body: JSON.stringify({ number: cleanPhone, text: initial_message }),
        });
        await sbAdmin.from('whatsapp_messages').insert({
          account_id: accountId, conversation_id: conv.id, instance_id: inst.id,
          from_me: true, message_type: 'text', content: initial_message,
          status: 'sent', sender_user_id: userId, timestamp: new Date().toISOString(),
        });
      }
      return new Response(JSON.stringify({ ok: true, conversation: conv }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
