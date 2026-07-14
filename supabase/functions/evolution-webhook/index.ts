// Public webhook — Evolution API llama aquí en cada evento
// Autenticado por header `apikey` que Evolution reenvía (== EVOLUTION_API_KEY)
// o por `x-webhook-token` == WEBHOOK_SHARED_SECRET (fallback opcional).
import { createClient } from 'npm:@supabase/supabase-js@2';

// CORS restrictivo: los webhooks los llama Evolution server-to-server (no browser),
// por lo que no necesitamos permitir orígenes de navegador.
const corsHeaders = {
  'Access-Control-Allow-Origin': 'null',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';
const WEBHOOK_SHARED_SECRET = Deno.env.get('EVOLUTION_WEBHOOK_SECRET') || '';

function timingSafeEqual(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isAuthorized(req: Request): boolean {
  const apikey = req.headers.get('apikey') || '';
  const token = req.headers.get('x-webhook-token') || '';
  if (EVOLUTION_KEY && timingSafeEqual(apikey, EVOLUTION_KEY)) return true;
  if (WEBHOOK_SHARED_SECRET && timingSafeEqual(token, WEBHOOK_SHARED_SECRET)) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 🔒 Rechazar cualquier POST sin firma válida antes de tocar la DB
  if (!isAuthorized(req)) {
    console.warn('[webhook] unauthorized request from', req.headers.get('x-forwarded-for'));
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload = await req.json();
    const instanceName = payload?.instance;
    const event = (payload?.event as string | undefined)?.toLowerCase().replace(/_/g, '.');
    console.log('[webhook] event:', event, 'instance:', instanceName);
    if (!instanceName) return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });


    const { data: instance } = await supabase
      .from('whatsapp_instances').select('id, account_id').eq('instance_name', instanceName).maybeSingle();
    if (!instance) { console.warn('[webhook] unknown instance', instanceName); return new Response(JSON.stringify({ ok: true, skip: 'unknown' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

    if (event === 'qrcode.updated' || event === 'connection.update') {
      const qr = payload?.data?.qrcode?.base64 || payload?.data?.qr || null;
      const state = payload?.data?.state || payload?.data?.status || null;
      const phone = payload?.data?.phone || payload?.data?.wuid?.split('@')[0] || null;
      const status = state === 'open' ? 'connected' : (state === 'close' ? 'disconnected' : 'connecting');
      await supabase.from('whatsapp_instances').update({
        qr_code: qr, status, ...(phone ? { phone_number: phone } : {}),
      }).eq('id', instance.id);
    }

    // Aceptar todas las variantes: messages.upsert, messages.update, send.message, message.any
    const isMsgEvent = event && (event.startsWith('messages.') || event === 'send.message' || event === 'message.upsert');
    if (isMsgEvent) {
      const raw = payload.data;
      const msgs = Array.isArray(raw) ? raw : (raw?.messages && Array.isArray(raw.messages) ? raw.messages : [raw]);
      console.log('[webhook] processing', msgs.length, 'msgs');
      for (const m of msgs) {
        if (!m?.key?.remoteJid) { console.log('[webhook] skip no remoteJid'); continue; }
        // Ignorar grupos y broadcast
        if (m.key.remoteJid.endsWith('@g.us') || m.key.remoteJid.endsWith('@broadcast')) continue;
        const remoteJid = m.key.remoteJid as string;
        const fromMe = !!m.key.fromMe;
        const messageId = m.key.id as string;
        const contactPhone = remoteJid.split('@')[0];
        const contactName = m.pushName || contactPhone;
        const ts = m.messageTimestamp ? new Date(Number(m.messageTimestamp) * 1000).toISOString() : new Date().toISOString();
        const msg = m.message || {};
        let content = msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || '';
        let messageType = 'text';
        let mediaMime: string | null = null;
        if (msg.imageMessage) { messageType = 'image'; mediaMime = msg.imageMessage.mimetype; }
        else if (msg.videoMessage) { messageType = 'video'; mediaMime = msg.videoMessage.mimetype; }
        else if (msg.audioMessage) { messageType = 'audio'; mediaMime = msg.audioMessage.mimetype; content = content || '[audio]'; }
        else if (msg.documentMessage) { messageType = 'document'; mediaMime = msg.documentMessage.mimetype; content = msg.documentMessage.fileName || '[documento]'; }
        else if (msg.stickerMessage) { messageType = 'sticker'; content = '[sticker]'; }
        else if (msg.locationMessage) { messageType = 'location'; content = '[ubicación]'; }
        if (!content) content = `[${messageType}]`;

        let { data: conv } = await supabase.from('whatsapp_conversations')
          .select('id, unread_count').eq('account_id', instance.account_id).eq('remote_jid', remoteJid).maybeSingle();

        if (!conv) {
          const { data: newConv } = await supabase.from('whatsapp_conversations').insert({
            account_id: instance.account_id, instance_id: instance.id, remote_jid: remoteJid,
            contact_name: contactName, contact_phone: contactPhone,
            last_message: content, last_message_at: ts, unread_count: fromMe ? 0 : 1,
          }).select('id, unread_count').single();
          conv = newConv;
        } else {
          await supabase.from('whatsapp_conversations').update({
            last_message: content, last_message_at: ts,
            unread_count: fromMe ? conv.unread_count : (conv.unread_count || 0) + 1,
            contact_name: contactName,
          }).eq('id', conv.id);
        }

        if (conv) {
          await supabase.from('whatsapp_messages').upsert({
            account_id: instance.account_id, conversation_id: conv.id, instance_id: instance.id,
            message_id: messageId, from_me: fromMe, message_type: messageType, content,
            media_mime: mediaMime, status: fromMe ? 'sent' : 'received', timestamp: ts, raw: m,
          }, { onConflict: 'message_id' });
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('webhook error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
