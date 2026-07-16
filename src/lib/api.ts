// src/lib/api.ts - Lovable Cloud (Supabase) API layer
// All functions return `any` to maintain backward compatibility with existing page types
import { supabase } from "@/integrations/supabase/client";

// Helper to get current user id from session (fast, no server round trip)
const getCurrentUserId = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("No autenticado");
  return session.user.id;
};

// Helper to get current user's account_id
const getAccountId = async (): Promise<string> => {
  const userId = await getCurrentUserId();
  const { data: profile } = await supabase
    .from("profiles")
    .select("account_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile?.account_id) throw new Error("Sin cuenta asociada");
  return profile.account_id;
};

// Helper to get current profile
const getCurrentProfile = async () => {
  const userId = await getCurrentUserId();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error("Perfil no encontrado");
  return profile as any;
};

const normalizeTime = (time?: string | null) => (time || "09:00").slice(0, 5);

const buildScheduledAt = (date?: string | null, time?: string | null) => {
  const safeDate = (date || new Date().toISOString().split("T")[0]).split("T")[0];
  return `${safeDate}T${normalizeTime(time)}:00`;
};

const normalizeAppointmentPayload = async (apptData: any, isUpdate = false) => {
  const payload: Record<string, any> = {};
  const has = (key: string) => Object.prototype.hasOwnProperty.call(apptData, key);

  if (!isUpdate || has("account_id")) {
    payload.account_id = apptData.account_id || await getAccountId();
  }

  if (!isUpdate || has("branch_id")) payload.branch_id = apptData.branch_id;
  if (has("client_id") || !isUpdate) payload.client_id = apptData.client_id || null;

  if (has("stylist_id") || has("employee_id") || !isUpdate) {
    const stylistId = apptData.stylist_id || apptData.employee_id || null;
    payload.stylist_id = stylistId;
    payload.employee_id = stylistId;
  }

  if (has("date") || has("time") || has("scheduled_at") || !isUpdate) {
    const date = (apptData.date || apptData.scheduled_at || new Date().toISOString()).split("T")[0];
    const time = normalizeTime(apptData.time || (apptData.scheduled_at ? apptData.scheduled_at.split("T")[1] : undefined));
    payload.date = date;
    payload.time = time;
    payload.scheduled_at = apptData.scheduled_at || buildScheduledAt(date, time);
  }

  if (has("duration") || has("duration_minutes") || !isUpdate) {
    payload.duration_minutes = Number(apptData.duration_minutes ?? apptData.duration ?? 30) || 30;
  }

  if (has("services") || !isUpdate) {
    const services = Array.isArray(apptData.services) ? apptData.services : [];
    payload.services = services;
    payload.service_id = services[0]?.service_id || null;
  }
  if (has("products") || !isUpdate) payload.products = Array.isArray(apptData.products) ? apptData.products : [];
  if (has("payments") || !isUpdate) payload.payments = Array.isArray(apptData.payments) ? apptData.payments : [];

  if (has("subtotal") || !isUpdate) payload.subtotal = Number(apptData.subtotal ?? 0) || 0;
  if (has("discount") || !isUpdate) payload.discount = Number(apptData.discount ?? 0) || 0;
  if (has("total") || has("total_amount") || !isUpdate) {
    const total = Number(apptData.total ?? apptData.total_amount ?? 0) || 0;
    payload.total = total;
    payload.total_amount = total;
  }
  if (has("tax")) payload.tax = Number(apptData.tax ?? 0) || 0;
  if (has("notes") || !isUpdate) payload.notes = apptData.notes || null;
  if (has("status") || !isUpdate) payload.status = apptData.status || "scheduled";
  if (has("payment_status")) payload.payment_status = apptData.payment_status;

  if (has("client_id") || !isUpdate) {
    const clientId = apptData.client_id;
    if (clientId) {
      const { data: client } = await supabase.from("clients").select("name, phone, email").eq("id", clientId).maybeSingle();
      payload.client_name = apptData.client_name ?? client?.name ?? null;
      payload.client_phone = apptData.client_phone ?? client?.phone ?? null;
      payload.client_email = apptData.client_email ?? client?.email ?? null;
    } else {
      payload.client_name = apptData.client_name ?? null;
      payload.client_phone = apptData.client_phone ?? null;
      payload.client_email = apptData.client_email ?? null;
    }
  }

  return payload;
};


// ============ AUTH ============
export const auth = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const profile = await getCurrentProfile();

    const { data: rolesList } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    const rolePriority = ["super_admin", "account_admin", "admin"];
    const roleData = (rolesList || []).sort((a: any, b: any) => {
      const ia = rolePriority.indexOf(a.role); const ib = rolePriority.indexOf(b.role);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })[0] || null;

    const user = {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: roleData?.role || "employee",
      branch_id: profile.branch_id,
      account_id: profile.account_id,
      color: profile.color,
      avatar_url: profile.avatar_url,
      active: profile.is_active,
      permissions: profile.permissions || null,
    };


    // Get subscription
    let subscription = null;
    if (profile.account_id) {
      const { data: subData } = await supabase
        .from("account_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("account_id", profile.account_id)
        .order("expires_at", { ascending: false })
        .limit(1)
        .single();
      
      if (subData) {
        const now = new Date();
        const expires = new Date(subData.expires_at);
        const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        subscription = {
          plan: (subData as any).subscription_plans?.name || "Básico",
          plan_id: subData.plan_id,
          status: subData.status as any,
          trial_ends_at: subData.expires_at,
          ends_at: subData.expires_at,
          days_remaining: diffDays,
        };
      }
    }

    return { user, token: data.session?.access_token, subscription };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  me: async () => {
    const userId = await getCurrentUserId();
    const profile = await getCurrentProfile();

    const { data: rolesList } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const rolePriority = ["super_admin", "account_admin", "admin"];
    const roleData = (rolesList || []).sort((a: any, b: any) => {
      const ia = rolePriority.indexOf(a.role); const ib = rolePriority.indexOf(b.role);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })[0] || null;

    let subscription = null;
    if (profile.account_id) {
      const { data: subData } = await supabase
        .from("account_subscriptions")
        .select("*, subscription_plans(*)")
        .eq("account_id", profile.account_id)
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        const now = new Date();
        const expires = new Date(subData.expires_at);
        const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        subscription = {
          plan: (subData as any).subscription_plans?.name || "Básico",
          plan_id: subData.plan_id,
          status: subData.status as any,
          trial_ends_at: subData.expires_at,
          ends_at: subData.expires_at,
          days_remaining: diffDays,
        };
      }
    }

    return {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: roleData?.role || "employee",
      branch_id: profile.branch_id,
      account_id: profile.account_id,
      color: profile.color,
      avatar_url: profile.avatar_url,
      active: profile.is_active,
      permissions: profile.permissions || null,
      subscription,

    };
  },

  signup: async (data: {
    account_name: string;
    branch_name: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
    admin_phone?: string;
    plan_id?: string;
  }) => {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.admin_email,
      password: data.admin_password,
      options: {
        data: { full_name: data.admin_name },
        emailRedirectTo: window.location.origin,
      },
    });
    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Error creando usuario");

    // 2. Complete account setup in the database so account, branch, admin role,
    // subscription, and default roles are created atomically and securely.
    const { error: setupError } = await (supabase as any).rpc("complete_signup", {
      p_account_name: data.account_name,
      p_branch_name: data.branch_name,
      p_admin_name: data.admin_name,
      p_admin_phone: data.admin_phone || null,
      p_plan_id: data.plan_id || null,
    });
    if (setupError) throw new Error(setupError.message);

    const profile = await getCurrentProfile();
    const user = {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: "account_admin",
      branch_id: profile.branch_id,
      account_id: profile.account_id,
      color: profile.color,
      avatar_url: profile.avatar_url,
      active: profile.is_active,
      permissions: null,
    };

    return { user, token: authData.session?.access_token };
  },

  verifyAdmin: async (email: string, password: string) => {
    try {
      // Verify by trying to sign in (without affecting current session)
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: "Credenciales inválidas" };
      return { success: true, admin_name: email };
    } catch {
      return { success: false, error: "Credenciales inválidas" };
    }
  },

  getUser: () => {
    const user = localStorage.getItem("salon_current_user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },
};

// ============ PLANS ============
export const plans = {
  getAll: async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price");
    if (error) throw error;
    return data.map(p => ({
      ...p,
      price_monthly: p.price,
    }));
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("subscription_plans").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
};

// ============ SUBSCRIPTIONS ============
export const subscriptions = {
  getCurrent: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase
      .from("account_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("account_id", accountId)
      .order("expires_at", { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    const now = new Date();
    const expires = new Date(data.expires_at);
    const diffDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      plan: (data as any).subscription_plans?.name || "Básico",
      plan_id: data.plan_id,
      status: data.status,
      trial_ends_at: data.expires_at,
      ends_at: data.expires_at,
      days_remaining: diffDays,
    };
  },
  getHistory: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase
      .from("account_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  getUsage: async () => ({ current_users: 0, max_users: 5, current_branches: 0, max_branches: 1 }),
  getPayments: async () => [],
  addPayment: async () => ({}),
  changePlan: async () => ({}),
  activate: async () => ({}),
  cancel: async () => ({}),
};

// ============ ACCOUNTS ============
export const accounts = {
  getCurrent: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("accounts").select("*").eq("id", accountId).single();
    if (error) throw error;
    return data;
  },
  updateCurrent: async (updates: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("accounts").update(updates).eq("id", accountId).select().single();
    if (error) throw error;
    return data;
  },
  getStats: async () => ({ total_appointments: 0, total_sales: 0, total_clients: 0 }),
};

// ============ ADMIN (Super Admin) ============
export const admin = {
  getAccounts: async () => {
    const { data, error } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  getAccountById: async (id: string) => {
    const { data, error } = await supabase.from("accounts").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  createAccount: async (accountData: any) => {
    const { data, error } = await supabase.from("accounts").insert(accountData).select().single();
    if (error) throw error;
    return data;
  },
  updateAccount: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("accounts").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  deleteAccount: async (id: string) => {
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) throw error;
  },
  getSubscription: async (accountId: string) => {
    const { data, error } = await supabase
      .from("account_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("account_id", accountId)
      .order("expires_at", { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data;
  },
  updateSubscription: async (accountId: string, updates: any) => {
    const { data, error } = await supabase
      .from("account_subscriptions")
      .update(updates)
      .eq("account_id", accountId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  extendTrial: async (accountId: string, data?: any) => {
    const days = data?.days || 14;
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);
    const { error } = await supabase
      .from("account_subscriptions")
      .update({ expires_at: newExpiry.toISOString(), status: "trial" as any })
      .eq("account_id", accountId);
    if (error) throw error;
  },
  getAccountPayments: async () => [],
  addPayment: async () => ({}),
  getAllPayments: async () => [],
  getStats: async () => {
    const { count: accountCount } = await supabase.from("accounts").select("*", { count: "exact", head: true });
    return { total_accounts: accountCount || 0 };
  },
};

// ============ BRANCHES ============
export const branches = {
  getAll: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("branches").select("*").eq("account_id", accountId).order("name");
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("branches").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (branchData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("branches").insert({ ...branchData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("branches").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ USERS (profiles) ============
export const users = {
  getAll: async (params?: { branch_id?: string; role?: string; active?: boolean }) => {
    const accountId = await getAccountId();
    let query = supabase.from("profiles").select("*, custom_roles(name, color, permissions)").eq("account_id", accountId);
    if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
    if (params?.active !== undefined) query = query.eq("is_active", params.active);
    const { data, error } = await query.order("full_name");
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      name: p.full_name,
      email: p.email,
      phone: p.phone,
      role: (p as any).custom_roles?.name || "employee",
      branch_id: p.branch_id,
      account_id: p.account_id,
      color: p.color || (p as any).custom_roles?.color || "#3B82F6",
      avatar_url: p.avatar_url,
      active: p.is_active,
      permissions: p.permissions || (p as any).custom_roles?.permissions || null,
      user_id: p.user_id,
      custom_role_id: p.custom_role_id,
    }));
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("profiles").select("*, custom_roles(*)").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (userData: any) => {
    // Calls edge function that creates a REAL auth user + profile + role
    // using the service role. Requires the caller to be admin/account_admin.
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phone: userData.phone,
        branch_id: userData.branch_id || null,
        custom_role_id: userData.custom_role_id || null,
        color: userData.color || "#3B82F6",
        permissions: userData.permissions || null,
        role: userData.role,
      },
    });
    if (error) throw new Error(error.message);
    if ((data as any)?.error) throw new Error((data as any).error);
    return (data as any)?.profile;
  },
  update: async (id: string, updates: any) => {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.full_name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.branch_id !== undefined) updateData.branch_id = updates.branch_id || null;
    if (updates.custom_role_id !== undefined) updateData.custom_role_id = updates.custom_role_id || null;
    if (updates.color !== undefined) updateData.color = updates.color;
    if (updates.active !== undefined) updateData.is_active = updates.active;
    if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
    
    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", id);
    if (error) throw error;
  },
};

// ============ CLIENTS ============
export const clients = {
  getAll: async (search?: string) => {
    const accountId = await getAccountId();
    let query = supabase.from("clients").select("*").eq("account_id", accountId);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error } = await query.order("name");
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("clients").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  getAppointments: async (id: string) => {
    const { data, error } = await supabase.from("appointments").select("*").eq("client_id", id).order("scheduled_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async (clientData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("clients").insert({ ...clientData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ SERVICES ============
export const services = {
  getAll: async (params?: { category?: string; active?: boolean }) => {
    const accountId = await getAccountId();
    let query = supabase.from("services").select("*").eq("account_id", accountId);
    if (params?.active !== undefined) query = query.eq("is_active", params.active);
    const { data, error } = await query.order("name");
    if (error) throw error;
    return data;
  },
  getCategories: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("categories").select("*").eq("account_id", accountId).eq("type", "service").order("name");
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("services").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (serviceData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("services").insert({ ...serviceData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  createBulk: async (servicesList: any[]) => {
    const accountId = await getAccountId();
    const items = servicesList.map(s => ({ ...s, account_id: accountId }));
    const { data, error } = await supabase.from("services").insert(items).select();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("services").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw error;
  },
  createCategory: async (catData: { name: string }) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("categories").insert({ ...catData, account_id: accountId, type: "service" }).select().single();
    if (error) throw error;
    return data;
  },
  updateCategory: async (id: string, updates: { name: string }) => {
    const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  deleteCategory: async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ PRODUCTS ============
export const products = {
  getAll: async (params?: { category?: string; active?: boolean; low_stock?: boolean }) => {
    const accountId = await getAccountId();
    let query = supabase.from("products").select("*").eq("account_id", accountId);
    if (params?.active !== undefined) query = query.eq("is_active", params.active);
    if (params?.low_stock) query = query.lt("stock", 10);
    const { data, error } = await query.order("name");
    if (error) throw error;
    return data;
  },
  getCategories: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("categories").select("*").eq("account_id", accountId).eq("type", "product").order("name");
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("products").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (productData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("products").insert({ ...productData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  updateStock: async (id: string, stock: number) => {
    const { data, error } = await supabase.from("products").update({ stock }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },
  createCategory: async (catData: { name: string }) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("categories").insert({ ...catData, account_id: accountId, type: "product" }).select().single();
    if (error) throw error;
    return data;
  },
  updateCategory: async (id: string, updates: { name: string }) => {
    const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  deleteCategory: async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ APPOINTMENTS ============
export const appointments = {
  getAll: async (params?: {
    branch_id?: string;
    stylist_id?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }) => {
    const accountId = await getAccountId();
    let query = supabase.from("appointments").select("*, clients(name, phone), services(name, price), profiles!appointments_employee_id_fkey(full_name, color)");
    // Filter by account branches
    const { data: branchIds } = await supabase.from("branches").select("id").eq("account_id", accountId);
    if (branchIds && branchIds.length > 0) {
      query = query.in("branch_id", branchIds.map(b => b.id));
    }
    if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
    if (params?.stylist_id) query = query.eq("employee_id", params.stylist_id);
    if (params?.status) query = query.eq("status", params.status);
    if (params?.date) {
      query = query.gte("scheduled_at", `${params.date}T00:00:00`).lt("scheduled_at", `${params.date}T23:59:59`);
    }
    if (params?.start_date) query = query.gte("scheduled_at", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("scheduled_at", `${params.end_date}T23:59:59`);
    
    const { data, error } = await query.order("scheduled_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("appointments").select("*, clients(*), services(*), profiles!appointments_employee_id_fkey(*)").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (apptData: any) => {
    const payload = await normalizeAppointmentPayload(apptData);
    const { data, error } = await supabase.from("appointments").insert(payload as any).select().single();
    if (error) throw error;
    import("@/lib/audit").then(({ logAudit }) => logAudit({ action: "create", entity_table: "appointments", entity_id: (data as any)?.id, summary: `Cita creada para ${(data as any)?.client_name || "cliente"} el ${(data as any)?.date}`, new_data: data }));
    // Auto-send WhatsApp confirmation (non-blocking)
    try {
      supabase.functions.invoke('evolution-api', { body: { action: 'send_template', type: 'appointment_confirmed', appointment_id: (data as any)?.id } })
        .catch((e) => console.warn('WA confirm skipped:', e?.message));
    } catch {}
    return data;
  },
  update: async (id: string, updates: any) => {
    const payload = await normalizeAppointmentPayload(updates, true);
    const { data, error } = await supabase.from("appointments").update(payload as any).eq("id", id).select().single();
    if (error) throw error;
    import("@/lib/audit").then(({ logAudit }) => logAudit({ action: "update", entity_table: "appointments", entity_id: id, summary: `Cita actualizada (${(data as any)?.status || "?"})`, new_data: data }));
    return data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data, error } = await supabase.from("appointments").update({ status }).eq("id", id).select().single();
    if (error) throw error;
    import("@/lib/audit").then(({ logAudit }) => logAudit({ action: "update", entity_table: "appointments", entity_id: id, summary: `Estado cambiado a ${status}` }));
    if (status === 'cancelled') {
      try {
        supabase.functions.invoke('evolution-api', { body: { action: 'send_template', type: 'appointment_cancelled', appointment_id: id } })
          .catch((e) => console.warn('WA cancel skipped:', e?.message));
      } catch {}
    }
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throw error;
    import("@/lib/audit").then(({ logAudit }) => logAudit({ action: "delete", entity_table: "appointments", entity_id: id, summary: `Cita eliminada` }));
  },
};

// ============ SALES ============
export const sales = {
  getAll: async (params?: { branch_id?: string; date?: string; start_date?: string; end_date?: string }) => {
    const accountId = await getAccountId();
    let query = supabase.from("sales").select("*").eq("account_id", accountId);
    if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
    if (params?.date) {
      query = query.gte("sale_date", `${params.date}T00:00:00`).lt("sale_date", `${params.date}T23:59:59`);
    }
    if (params?.start_date) query = query.gte("sale_date", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("sale_date", `${params.end_date}T23:59:59`);
    const { data, error } = await query.order("sale_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("sales").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (saleData: any) => {
    // Uses atomic RPC that validates + decrements stock and writes inventory movements.
    const { data, error } = await supabase.rpc("create_sale_atomic", { p_sale: saleData });
    if (error) throw new Error(error.message);
    import("@/lib/audit").then(({ logAudit }) => logAudit({ action: "create", entity_table: "sales", entity_id: (data as any)?.id, summary: `Venta ${(data as any)?.folio || ""} por $${(data as any)?.total || 0}`, new_data: data }));
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) throw error;
    import("@/lib/audit").then(({ logAudit }) => logAudit({ action: "delete", entity_table: "sales", entity_id: id, summary: `Venta eliminada` }));
  },
};

// ============ EXPENSES ============
export const expenses = {
  getAll: async (params?: { branch_id?: string; category?: string; date?: string; start_date?: string; end_date?: string }) => {
    const accountId = await getAccountId();
    let query = supabase.from("expenses").select("*").eq("account_id", accountId);
    if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
    if (params?.category) query = query.eq("category", params.category);
    if (params?.start_date) query = query.gte("expense_date", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("expense_date", `${params.end_date}T23:59:59`);
    const { data, error } = await query.order("expense_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  getCategories: async () => {
    const accountId = await getAccountId();
    const defaults = ["Renta", "Servicios", "Nómina", "Materiales", "Mantenimiento", "Marketing", "Otros"];
    const { data } = await supabase
      .from("categories").select("name")
      .eq("account_id", accountId).eq("type", "expense").order("name");
    const fromDb = (data || []).map((c: any) => c.name).filter(Boolean);
    return fromDb.length ? fromDb : defaults;
  },

  getSummary: async (params?: { branch_id?: string; start_date?: string; end_date?: string }) => {
    const all = await expenses.getAll(params);
    const total = all.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    return { total, count: all.length, items: all };
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("expenses").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (expenseData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("expenses").insert({ ...expenseData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("expenses").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ SUPPLIERS ============
export const suppliers = {
  getAll: async (params?: { active?: boolean; search?: string }) => {
    const accountId = await getAccountId();
    let query = supabase.from("suppliers").select("*").eq("account_id", accountId);
    if (params?.active !== undefined) query = query.eq("is_active", params.active);
    if (params?.search) query = query.or(`name.ilike.%${params.search}%,contact_name.ilike.%${params.search}%`);
    const { data, error } = await query.order("name");
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (supplierData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("suppliers").insert({ ...supplierData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("suppliers").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) throw error;
  },
  getStatement: async (id: string, params?: { start_date?: string; end_date?: string }) => {
    let query = supabase.from("purchases").select("*").eq("supplier_id", id);
    if (params?.start_date) query = query.gte("purchase_date", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("purchase_date", `${params.end_date}T23:59:59`);
    const { data, error } = await query.order("purchase_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  getPending: async (id: string) => {
    const { data, error } = await supabase.from("purchases").select("*").eq("supplier_id", id).in("status", ["pending", "partial"]);
    if (error) throw error;
    return data;
  },
};

// ============ PURCHASES ============
export const purchases = {
  getAll: async (params?: { branch_id?: string; date?: string; start_date?: string; end_date?: string; status?: string; supplier_id?: string }) => {
    const accountId = await getAccountId();
    let query = supabase.from("purchases").select("*, suppliers(name)").eq("account_id", accountId);
    if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
    if (params?.status) query = query.eq("status", params.status);
    if (params?.supplier_id) query = query.eq("supplier_id", params.supplier_id);
    if (params?.start_date) query = query.gte("purchase_date", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("purchase_date", `${params.end_date}T23:59:59`);
    const { data, error } = await query.order("purchase_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("purchases").select("*, suppliers(*), purchase_payments(*)").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (purchaseData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("purchases").insert({ ...purchaseData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  addPayment: async (id: string, paymentData: any) => {
    // Atomic RPC: inserts payment + updates purchase status/amount_paid with validation.
    const { data, error } = await supabase.rpc("register_purchase_payment", {
      p_purchase_id: id,
      p_amount: Number(paymentData.amount),
      p_payment_method: paymentData.payment_method || "cash",
      p_notes: paymentData.notes || null,
    });
    if (error) throw new Error(error.message);
    return data;
  },
  cancel: async (id: string) => {
    const { error } = await supabase.from("purchases").update({ status: "cancelled" }).eq("id", id);
    if (error) throw error;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("purchases").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ INVENTORY ============
export const inventory = {
  getMovements: async (params?: { branch_id?: string; product_id?: string; type?: string; start_date?: string; end_date?: string }) => {
    const accountId = await getAccountId();
    let query = supabase.from("inventory_movements").select("*, products(name)").eq("account_id", accountId);
    if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
    if (params?.product_id) query = query.eq("product_id", params.product_id);
    if (params?.type) query = query.eq("type", params.type);
    if (params?.start_date) query = query.gte("created_at", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("created_at", `${params.end_date}T23:59:59`);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  getStock: async (params?: { low_stock?: boolean }) => {
    const accountId = await getAccountId();
    let query = supabase.from("products").select("id, name, stock, sku, price").eq("account_id", accountId).eq("is_active", true);
    if (params?.low_stock) query = query.lt("stock", 10);
    const { data, error } = await query.order("name");
    if (error) throw error;
    return data;
  },
  getValue: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("products").select("stock, price").eq("account_id", accountId).eq("is_active", true);
    if (error) throw error;
    const totalValue = (data || []).reduce((sum, p) => sum + (Number(p.stock) || 0) * Number(p.price), 0);
    return { total_value: totalValue, total_products: data?.length || 0 };
  },
  addIn: async (movData: any) => {
    const { data, error } = await supabase.rpc('adjust_product_stock', {
      p_product_id: movData.product_id,
      p_delta: Number(movData.quantity),
      p_type: 'in',
      p_reason: movData.reason || 'Entrada',
      p_reference_id: movData.reference_id || null,
      p_branch_id: movData.branch_id || null,
    });
    if (error) throw error;
    return data;
  },
  addOut: async (movData: any) => {
    const { data, error } = await supabase.rpc('adjust_product_stock', {
      p_product_id: movData.product_id,
      p_delta: -Math.abs(Number(movData.quantity)),
      p_type: 'out',
      p_reason: movData.reason || 'Salida',
      p_reference_id: movData.reference_id || null,
      p_branch_id: movData.branch_id || null,
    });
    if (error) throw error;
    return data;
  },
  adjust: async (movData: any) => {
    const { data: product } = await supabase
      .from('products').select('stock').eq('id', movData.product_id).maybeSingle();
    const prev = Number(product?.stock) || 0;
    const target = Number(movData.new_stock);
    const delta = target - prev;
    const { data, error } = await supabase.rpc('adjust_product_stock', {
      p_product_id: movData.product_id,
      p_delta: delta,
      p_type: 'adjustment',
      p_reason: movData.reason || 'Ajuste',
      p_reference_id: movData.reference_id || null,
      p_branch_id: movData.branch_id || null,
    });
    if (error) throw error;
    return data;
  },
};


// ============ SHIFTS ============
export const shifts = {
  getAll: async (params?: { branch_id?: string; status?: string; date?: string; start_date?: string; end_date?: string }) => {
    const accountId = await getAccountId();
    let query = supabase.from("shifts").select("*, profiles!shifts_user_id_fkey(full_name)").eq("account_id", accountId);
    if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
    if (params?.status) query = query.eq("status", params.status);
    if (params?.start_date) query = query.gte("opened_at", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("opened_at", `${params.end_date}T23:59:59`);
    const { data, error } = await query.order("opened_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  getOpen: async (branch_id: string) => {
    const { data, error } = await supabase.from("shifts").select("*, profiles!shifts_user_id_fkey(full_name)").eq("branch_id", branch_id).eq("status", "open").limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("shifts").select("*, profiles!shifts_user_id_fkey(full_name)").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  getSummary: async (id: string) => {
    const { data: shift } = await supabase.from("shifts").select("*").eq("id", id).single();
    return shift;
  },
  open: async (shiftData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("shifts").insert({ ...shiftData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  close: async (id: string, final_cash: number) => {
    const { data, error } = await supabase.from("shifts").update({ status: "closed", final_cash, closed_at: new Date().toISOString() }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};

// ============ CASH MOVEMENTS ============
export const cashMovements = {
  getAll: async (params?: { shift_id?: string; branch_id?: string; start_date?: string; end_date?: string }) => {
    const accountId = await getAccountId();
    let query = supabase.from("cash_movements").select("*, profiles!cash_movements_user_id_fkey(full_name)").eq("account_id", accountId);
    if (params?.shift_id) query = query.eq("shift_id", params.shift_id);
    if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
    if (params?.start_date) query = query.gte("created_at", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("created_at", `${params.end_date}T23:59:59`);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  create: async (movement: { shift_id?: string; branch_id?: string; type: string; amount: number; reason?: string }) => {
    const accountId = await getAccountId();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("cash_movements").insert({
      ...movement,
      account_id: accountId,
      user_id: user?.id,
    }).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("cash_movements").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ COMMISSION PAYMENTS ============
export const commissionPayments = {
  getAll: async (params?: { employee_id?: string; start_date?: string; end_date?: string }) => {
    const accountId = await getAccountId();
    let query = (supabase as any).from("commission_payments").select("*").eq("account_id", accountId);
    if (params?.employee_id) query = query.eq("employee_id", params.employee_id);
    if (params?.start_date) query = query.gte("paid_at", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("paid_at", `${params.end_date}T23:59:59`);
    const { data, error } = await query.order("paid_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  register: async (payload: {
    employee_id: string;
    employee_name?: string;
    period_from: string;
    period_to: string;
    commission_amount: number;
    tips_amount: number;
    payment_method?: string;
    notes?: string;
    sales_included?: any[];
    branch_id?: string;
  }) => {
    const { data, error } = await (supabase as any).rpc("register_commission_payment", {
      p_employee_id: payload.employee_id,
      p_employee_name: payload.employee_name ?? null,
      p_period_from: payload.period_from,
      p_period_to: payload.period_to,
      p_commission_amount: payload.commission_amount,
      p_tips_amount: payload.tips_amount,
      p_payment_method: payload.payment_method ?? "cash",
      p_notes: payload.notes ?? null,
      p_sales_included: payload.sales_included ?? [],
      p_branch_id: payload.branch_id ?? null,
    });
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await (supabase as any).from("commission_payments").delete().eq("id", id);
    if (error) throw error;
  },
};



// ============ CASH CUTS ============
export const cashCuts = {
  getAll: async (params?: { branch_id?: string; start_date?: string; end_date?: string }) => {
    const accountId = await getAccountId();
    let query = supabase.from("cash_cuts").select("*, profiles!cash_cuts_user_id_fkey(full_name)").eq("account_id", accountId);
    if (params?.branch_id) query = query.eq("branch_id", params.branch_id);
    if (params?.start_date) query = query.gte("cut_date", `${params.start_date}T00:00:00`);
    if (params?.end_date) query = query.lte("cut_date", `${params.end_date}T23:59:59`);
    const { data, error } = await query.order("cut_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("cash_cuts").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (cutData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("cash_cuts").insert({ ...cutData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("cash_cuts").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ ROLES (Custom roles) ============
export const roles = {
  getAll: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("custom_roles").select("*").eq("account_id", accountId).order("name");
    if (error) throw error;
    return data;
  },
  getById: async (id: string) => {
    const { data, error } = await supabase.from("custom_roles").select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },
  create: async (roleData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("custom_roles").insert({ ...roleData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("custom_roles").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  duplicate: async (id: string) => {
    const { data: original, error: fetchError } = await supabase.from("custom_roles").select("*").eq("id", id).single();
    if (fetchError) throw fetchError;
    const { id: _, created_at, updated_at, ...rest } = original;
    const { data, error } = await supabase.from("custom_roles").insert({ ...rest, name: `${rest.name} (Copia)`, is_system: false }).select().single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("custom_roles").delete().eq("id", id);
    if (error) throw error;
  },
  getUsersList: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("profiles").select("id, full_name, email, custom_role_id, custom_roles(name)").eq("account_id", accountId);
    if (error) throw error;
    return data;
  },
  assignRole: async (data: any) => {
    const { error } = await supabase.from("profiles").update({ custom_role_id: data.role_id }).eq("id", data.user_id);
    if (error) throw error;
  },
  removeRole: async (user_id: string) => {
    const { error } = await supabase.from("profiles").update({ custom_role_id: null }).eq("id", user_id);
    if (error) throw error;
  },
};

// ============ SCHEDULES ============
export const schedules = {
  getBranch: async (branch_id: string) => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("type", "branch")
      .eq("target_id", branch_id)
      .maybeSingle();
    if (error) throw error;
    return data?.schedule || {};
  },
  updateBranch: async (branch_id: string, schedule: any) => {
    const accountId = await getAccountId();
    const { data: existing } = await supabase
      .from("schedules")
      .select("id")
      .eq("type", "branch")
      .eq("target_id", branch_id)
      .single();
    
    if (existing) {
      const { data, error } = await supabase
        .from("schedules")
        .update({ schedule })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("schedules")
        .insert({ account_id: accountId, type: "branch", target_id: branch_id, schedule })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  },
  getStylist: async (stylist_id: string, _branch_id?: string) => {
    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("type", "employee")
      .eq("target_id", stylist_id)
      .maybeSingle();
    if (error) throw error;
    return data?.schedule || {};
  },
  updateStylist: async (stylist_id: string, scheduleData: any) => {
    const accountId = await getAccountId();
    const { data: existing } = await supabase
      .from("schedules")
      .select("id")
      .eq("type", "employee")
      .eq("target_id", stylist_id)
      .single();
    
    if (existing) {
      const { data, error } = await supabase.from("schedules").update({ schedule: scheduleData.schedule || scheduleData }).eq("id", existing.id).select().single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase.from("schedules").insert({ account_id: accountId, type: "employee", target_id: stylist_id, schedule: scheduleData.schedule || scheduleData }).select().single();
      if (error) throw error;
      return data;
    }
  },
  getBlocked: async (params?: { type?: string; target_id?: string; start_date?: string; end_date?: string }) => {
    const accountId = await getAccountId();
    let query = supabase.from("blocked_days").select("*").eq("account_id", accountId);
    if (params?.type) query = query.eq("type", params.type);
    if (params?.target_id) query = query.eq("target_id", params.target_id);
    if (params?.start_date) query = query.gte("start_date", params.start_date);
    if (params?.end_date) query = query.lte("end_date", params.end_date);
    const { data, error } = await query.order("start_date", { ascending: false });
    if (error) throw error;
    return data;
  },
  createBlocked: async (blockData: any) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from("blocked_days").insert({ ...blockData, account_id: accountId }).select().single();
    if (error) throw error;
    return data;
  },
  updateBlocked: async (id: string, updates: any) => {
    const { data, error } = await supabase.from("blocked_days").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
  deleteBlocked: async (id: string) => {
    const { error } = await supabase.from("blocked_days").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ CONFIG ============
export const config = {
  get: async () => {
    try {
      const account = await accounts.getCurrent();
      return account;
    } catch {
      return {};
    }
  },
  update: async (data: any) => accounts.updateCurrent(data),
};

// ============ DASHBOARD ============
export const dashboard = {
  get: async (branch_id?: string) => {
    const accountId = await getAccountId();
    const today = new Date().toISOString().split("T")[0];
    
    // Get today's appointments count
    let apptQuery = supabase.from("appointments").select("*", { count: "exact", head: true });
    const { data: branchIds } = await supabase.from("branches").select("id").eq("account_id", accountId);
    if (branchIds) apptQuery = apptQuery.in("branch_id", branchIds.map(b => b.id));
    if (branch_id) apptQuery = apptQuery.eq("branch_id", branch_id);
    apptQuery = apptQuery.gte("scheduled_at", `${today}T00:00:00`).lt("scheduled_at", `${today}T23:59:59`);
    const { count: todayAppointments } = await apptQuery;

    // Get today's sales
    let salesQuery = supabase.from("sales").select("total").eq("account_id", accountId);
    if (branch_id) salesQuery = salesQuery.eq("branch_id", branch_id);
    salesQuery = salesQuery.gte("sale_date", `${today}T00:00:00`).lt("sale_date", `${today}T23:59:59`);
    const { data: todaySales } = await salesQuery;
    const totalRevenue = (todaySales || []).reduce((sum: number, s: any) => sum + Number(s.total), 0);

    // Get total clients
    const { count: totalClients } = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("account_id", accountId);

    return {
      today_appointments: todayAppointments || 0,
      today_revenue: totalRevenue,
      total_clients: totalClients || 0,
      pending_appointments: 0,
    };
  },
  getReports: async () => [],
};

// ============ CATEGORIES ============
export const categories = {
  getAll: async (type?: "product" | "service" | "expense") => {
    const accountId = await getAccountId();
    let query = supabase.from("categories").select("*").eq("account_id", accountId);
    if (type) query = query.eq("type", type);
    const { data, error } = await query.order("name");
    if (error) throw error;
    return data;
  },
  create: async (input: { name: string; type: "product" | "service" | "expense" }) => {
    const accountId = await getAccountId();
    const { data, error } = await supabase
      .from("categories")
      .insert({ account_id: accountId, name: input.name.trim(), type: input.type })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  delete: async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

// ============ WHATSAPP TEMPLATES ============
export const WA_TEMPLATE_TYPES = [
  {
    type: 'appointment_confirmed',
    label: 'Confirmación al agendar',
    defaultBody:
`✨ *¡Cita confirmada!* ✨

Hola *{{cliente}}* 👋
Tu cita en *{{negocio}}* quedó agendada:

🗓️ *Fecha:* {{fecha}}
⏰ *Hora:* {{hora}}
💇 *Servicio:* {{servicio}}
👤 *Con:* {{estilista}}
📍 *Sucursal:* {{sucursal}}

Te pedimos llegar 5 min antes 🙌
Si necesitas *reprogramar o cancelar*, responde a este mensaje.

¡Nos vemos pronto! 💖`,
  },
  {
    type: 'appointment_reminder_24h',
    label: 'Recordatorio 24h antes',
    defaultBody:
`🔔 *Recordatorio de tu cita*

Hola *{{cliente}}* 😊
Solo para recordarte tu cita de *mañana*:

🗓️ {{fecha}}
⏰ {{hora}}
💇 {{servicio}}
👤 {{estilista}}
📍 {{sucursal}}

¿Confirmas tu asistencia? Responde:
✅ *SÍ* para confirmar
🔄 *CAMBIAR* para reagendar

¡Te esperamos en {{negocio}}! 💫`,
  },
  {
    type: 'appointment_reminder_2h',
    label: 'Recordatorio 2h antes',
    defaultBody:
`⏳ *¡Tu cita es en 2 horas!*

Hola *{{cliente}}* 👋
Nos vemos hoy a las *{{hora}}* en *{{negocio}}* ({{sucursal}}) para tu *{{servicio}}* con {{estilista}}.

Tips para llegar a tiempo:
• Sal con 15 min de anticipación 🚗
• Trae tu método de pago preferido 💳
• Si tienes alguna referencia visual, ¡mándala! 📸

¡Nos vemos pronto! ✨`,
  },
  {
    type: 'appointment_cancelled',
    label: 'Cancelación de cita',
    defaultBody:
`❌ *Cita cancelada*

Hola *{{cliente}}*,
Tu cita del *{{fecha}}* a las *{{hora}}* en *{{negocio}}* ha sido cancelada.

Si fue por error o quieres *reagendar*, contáctanos por este medio y con gusto te buscamos un nuevo horario 🗓️

¡Esperamos verte pronto! 💖
— {{negocio}}`,
  },
  {
    type: 'payment_receipt',
    label: 'Recibo de pago',
    defaultBody:
`🧾 *¡Gracias por tu compra!* 🎉

Hola *{{cliente}}*, aquí tu comprobante:

🔖 *Folio:* {{folio}}
🗓️ *Fecha:* {{fecha}} {{hora}}
📍 *Sucursal:* {{sucursal}}
💰 *Total pagado:* $ {{total}}

Guarda este mensaje como tu recibo digital.
¡Nos encantaría verte pronto de nuevo! 💖

— *{{negocio}}*`,
  },
] as const;


export const whatsappTemplates = {
  getAll: async () => {
    const accountId = await getAccountId();
    const { data, error } = await supabase.from('whatsapp_templates').select('*').eq('account_id', accountId);
    if (error) throw error;
    return data || [];
  },
  seedIfMissing: async () => {
    const accountId = await getAccountId();
    const existing = await whatsappTemplates.getAll();
    const existingTypes = new Set((existing as any[]).map((t: any) => t.type).filter(Boolean));
    const missing = WA_TEMPLATE_TYPES.filter(t => !existingTypes.has(t.type));
    if (missing.length === 0) return existing;
    const rows = missing.map(t => ({
      account_id: accountId, type: t.type, name: t.label, content: t.defaultBody, enabled: true,
    }));
    const { error } = await supabase.from('whatsapp_templates').insert(rows as any);
    if (error) console.warn('seed templates:', error.message);
    return whatsappTemplates.getAll();
  },
  upsert: async (type: string, patch: { content?: string; enabled?: boolean; name?: string }) => {
    const accountId = await getAccountId();
    const { data: existing } = await supabase.from('whatsapp_templates')
      .select('id').eq('account_id', accountId).eq('type', type).maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from('whatsapp_templates').update(patch as any).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('whatsapp_templates').insert({
        account_id: accountId, type, name: type, content: patch.content || '', enabled: patch.enabled ?? true,
      } as any);
      if (error) throw error;
    }
  },
  sendTemplate: async (payload: { type: string; appointment_id?: string; sale_id?: string; phone?: string; extra_vars?: Record<string, string> }) => {
    const { data, error } = await supabase.functions.invoke('evolution-api', { body: { action: 'send_template', ...payload } });
    if (error) throw error;
    return data;
  },
};




// Export all
export const api: any = {
  auth,
  plans,
  subscriptions,
  accounts,
  admin,
  branches,
  users,
  clients,
  services,
  products,
  appointments,
  sales,
  expenses,
  suppliers,
  purchases,
  inventory,
  shifts,
  cashMovements,
  commissionPayments,

  cashCuts,
  roles,
  schedules,
  config,
  dashboard,
  categories,
  whatsappTemplates,
};

export default api as any;

