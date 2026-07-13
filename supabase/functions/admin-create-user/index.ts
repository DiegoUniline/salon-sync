// Edge function: admin-create-user
// Creates a real auth user + linked profile using the service role.
// Only callable by an authenticated user with account_admin/super_admin role
// within the same account.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return json({ error: "No autenticado" }, 401);
    }

    // Verify caller
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Sesión inválida" }, 401);
    }
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Get caller account + verify role
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("account_id")
      .eq("user_id", callerId)
      .maybeSingle();
    if (!callerProfile?.account_id) {
      return json({ error: "Sin cuenta asociada" }, 403);
    }

    const { data: rolesList } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const allowed = (rolesList || []).some((r: any) =>
      ["super_admin", "account_admin", "admin"].includes(r.role)
    );
    if (!allowed) {
      return json({ error: "Sin permisos para crear usuarios" }, 403);
    }

    const body = await req.json();
    const {
      email,
      password,
      name,
      phone,
      branch_id,
      custom_role_id,
      color,
      permissions,
      role,
    } = body || {};

    if (!email || !password || !name) {
      return json({ error: "email, password y name son requeridos" }, 400);
    }
    if (String(password).length < 8) {
      return json({ error: "La contraseña debe tener al menos 8 caracteres" }, 400);
    }

    // Create auth user (email pre-confirmed)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message || "No se pudo crear el usuario" }, 400);
    }
    const newUserId = created.user.id;

    // Upsert profile linking to caller's account (trigger creates a base row)
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .upsert(
        {
          user_id: newUserId,
          full_name: name,
          email,
          phone: phone || null,
          account_id: callerProfile.account_id,
          branch_id: branch_id || null,
          custom_role_id: custom_role_id || null,
          color: color || "#3B82F6",
          permissions: permissions || null,
          is_active: true,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    if (profErr) {
      // Rollback auth user if profile insert failed
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: profErr.message }, 400);
    }

    // Assign role (default 'employee')
    const roleName = role && ["admin", "account_admin", "employee"].includes(role) ? role : "employee";
    await admin.from("user_roles").insert({ user_id: newUserId, role: roleName });

    return json({ success: true, profile, user_id: newUserId });
  } catch (e: any) {
    return json({ error: e?.message || "Error interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
