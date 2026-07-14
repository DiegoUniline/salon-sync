// Cron-invoked: envía recordatorios 24h y 2h antes de la cita.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function callSendTemplate(accountId: string, type: string, appointmentId: string) {
  // Invoke evolution-api using service role token so send_template runs in that account's context
  // We can't easily impersonate the account admin, so we call the internal path directly.
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/evolution-api-internal`;
  // Instead, replicate here inline (mini version) — talk directly.
  const { data: tpl } = await sb.from('whatsapp_templates')
    .select('*').eq('account_id', accountId).eq('type', type).maybeSingle();
  if (!tpl || tpl.enabled === false) return { skipped: 'no_template' };

  const { data: inst } = await sb.from('whatsapp_instances').select('*').eq('account_id', accountId).maybeSingle();
  if (!inst || inst.status !== 'connected') return { skipped: 'not_connected' };

  const { data: appt } = await sb.from('appointments')
    .select('*, clients(name, phone), services(name), profiles!appointments_employee_id_fkey(full_name), branches(name)')
    .eq('id', appointmentId).maybeSingle();
  if (!appt) return { skipped: 'no_appt' };

  const phone = appt.client_phone || (appt as any).clients?.phone;
  if (!phone) return { skipped: 'no_phone' };

  const { data: account } = await sb.from('accounts').select('name').eq('id', accountId).maybeSingle();
  const vars: Record<string, string> = {
    cliente: appt.client_name || (appt as any).clients?.name || '',
    fecha: appt.date || '',
    hora: (appt.time || '').slice(0, 5),
    servicio: (appt as any).services?.name || '',
    estilista: (appt as any).profiles?.full_name || '',
    sucursal: (appt as any).branches?.name || '',
    total: String(appt.total || ''),
    negocio: account?.name || '',
  };
  const rendered = String(tpl.content || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => vars[k] ?? '');
  const clean = String(phone).replace(/\D/g, '');

  const EVOLUTION_URL = (Deno.env.get('EVOLUTION_API_URL') || '').replace(/\/$/, '');
  const EVOLUTION_KEY = Deno.env.get('EVOLUTION_API_KEY') || '';
  const res = await fetch(`${EVOLUTION_URL}/message/sendText/${inst.instance_name}`, {
    method: 'POST',
    headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ number: clean, text: rendered }),
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok) return { error: `evo ${res.status}`, body: result };

  const remoteJid = `${clean}@s.whatsapp.net`;
  const { data: conv } = await sb.from('whatsapp_conversations').upsert({
    account_id: accountId, instance_id: inst.id, remote_jid: remoteJid,
    contact_phone: clean, contact_name: vars.cliente || clean,
    last_message: rendered, last_message_at: new Date().toISOString(),
  }, { onConflict: 'account_id,remote_jid' }).select().single();

  await sb.from('whatsapp_messages').insert({
    account_id: accountId, conversation_id: conv?.id, instance_id: inst.id,
    from_me: true, message_type: 'text', content: rendered,
    status: 'sent', timestamp: new Date().toISOString(),
    raw: { template_type: type, source: 'cron', result },
  });
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const now = new Date();
    // Look at appointments in the next 24h ± 15min and 2h ± 15min
    const in23h45 = new Date(now.getTime() + (23 * 60 + 45) * 60000);
    const in24h15 = new Date(now.getTime() + (24 * 60 + 15) * 60000);
    const in1h45 = new Date(now.getTime() + (1 * 60 + 45) * 60000);
    const in2h15 = new Date(now.getTime() + (2 * 60 + 15) * 60000);

    // Query a wide window; we filter in JS by combining date+time
    const startDay = new Date(now); startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(now); endDay.setDate(endDay.getDate() + 2);
    const { data: appts } = await sb.from('appointments')
      .select('id, account_id, date, time, status, reminder_24h_sent_at, reminder_2h_sent_at')
      .neq('status', 'cancelled')
      .gte('date', startDay.toISOString().slice(0, 10))
      .lte('date', endDay.toISOString().slice(0, 10));

    let sent24 = 0, sent2 = 0;
    for (const a of (appts || [])) {
      if (!a.date || !a.time) continue;
      const at = new Date(`${a.date}T${a.time}`);
      if (isNaN(at.getTime())) continue;

      if (!a.reminder_24h_sent_at && at >= in23h45 && at <= in24h15) {
        const r = await callSendTemplate(a.account_id, 'appointment_reminder_24h', a.id);
        await sb.from('appointments').update({ reminder_24h_sent_at: new Date().toISOString() }).eq('id', a.id);
        if ((r as any)?.ok) sent24++;
      }
      if (!a.reminder_2h_sent_at && at >= in1h45 && at <= in2h15) {
        const r = await callSendTemplate(a.account_id, 'appointment_reminder_2h', a.id);
        await sb.from('appointments').update({ reminder_2h_sent_at: new Date().toISOString() }).eq('id', a.id);
        if ((r as any)?.ok) sent2++;
      }
    }
    return new Response(JSON.stringify({ ok: true, sent24, sent2, considered: appts?.length || 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
