// Edge function: admin-create-user
// Creates a real auth user + linked profile using the service role.
// Only callable by an authenticated user with account_admin/super_admin role
// within the same account.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGINS = [
  'https://unilineagenda.lovable.app',
  'https://id-preview--20957c29-e65e-46be-838f-83982459eadb.lovable.app',
  'http://localhost:8080',
  'http://localhost:5173',
];

function buildCors(req: Request) {
  const origin = req.headers.get('origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: buildCors(req) });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return json(req, { error: "No autenticado" }, 401);
    }

    // Verify caller
    const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !userData.user) {
      return json(req, { error: "Sesión inválida" }, 401);
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
      return json(req, { error: "Sin cuenta asociada" }, 403);
    }

    const { data: rolesList } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const allowed = (rolesList || []).some((r: any) =>
      ["super_admin", "account_admin", "admin"].includes(r.role)
    );
    if (!allowed) {
      return json(req, { error: "Sin permisos para crear usuarios" }, 403);
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
      return json(req, { error: "email, password y name son requeridos" }, 400);
    }
    if (String(password).length < 8) {
      return json(req, { error: "La contraseña debe tener al menos 8 caracteres" }, 400);
    }

    // Create auth user (email pre-confirmed)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (createErr || !created.user) {
      return json(req, { error: createErr?.message || "No se pudo crear el usuario" }, 400);
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
      return json(req, { error: profErr.message }, 400);
    }

    // Whitelist de roles asignables según jerarquía del caller
    const callerRoles = (rolesList || []).map((r: any) => r.role);
    const isSuperAdmin = callerRoles.includes("super_admin");
    const isAccountAdmin = callerRoles.includes("account_admin");

    let assignable: string[];
    if (isSuperAdmin) assignable = ["super_admin", "account_admin", "admin", "employee"];
    else if (isAccountAdmin) assignable = ["admin", "employee"]; // NO puede crear account_admin ni super_admin
    else assignable = ["employee"];

    const requestedRole = typeof role === "string" ? role : "employee";
    if (role && !assignable.includes(requestedRole)) {
      await admin.auth.admin.deleteUser(newUserId);
      return json(req, { error: `No tienes permisos para asignar el rol '${requestedRole}'` }, 403);
    }
    const roleName = assignable.includes(requestedRole) ? requestedRole : "employee";
    await admin.from("user_roles").insert({ user_id: newUserId, role: roleName });


    return json(req, { success: true, profile, user_id: newUserId });
  } catch (e: any) {
    return json(req, { error: e?.message || "Error interno" }, 500);
  }
});

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...buildCors(req), "Content-Type": "application/json" },
  });
}
