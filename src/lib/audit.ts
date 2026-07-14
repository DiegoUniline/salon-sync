import { supabase } from "@/integrations/supabase/client";

let cachedAccountId: string | null = null;
let cachedUserName: string | null = null;

async function getContext() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (!cachedAccountId) {
    const { data } = await supabase.from("profiles").select("account_id, full_name").eq("user_id", user.id).maybeSingle();
    cachedAccountId = data?.account_id || null;
    cachedUserName = data?.full_name || user.email || null;
  }
  return { userId: user.id, accountId: cachedAccountId, userName: cachedUserName };
}

export type AuditAction = "create" | "update" | "delete" | "login" | "logout" | "print" | "custom";

export async function logAudit(params: {
  action: AuditAction;
  entity_table: string;
  entity_id?: string | null;
  summary?: string;
  old_data?: any;
  new_data?: any;
}) {
  try {
    const ctx = await getContext();
    if (!ctx?.accountId) return;
    await supabase.from("audit_logs").insert({
      account_id: ctx.accountId,
      user_id: ctx.userId,
      user_name: ctx.userName,
      action: params.action,
      entity_table: params.entity_table,
      entity_id: params.entity_id || null,
      summary: params.summary || null,
      old_data: params.old_data || null,
      new_data: params.new_data || null,
      user_agent: navigator.userAgent.slice(0, 200),
    });
  } catch (e) {
    console.warn("audit log failed", e);
  }
}

export function clearAuditCache() {
  cachedAccountId = null;
  cachedUserName = null;
}
