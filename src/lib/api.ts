// src/lib/api.ts
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://tu-salon-api-7a74d0e1632a.herokuapp.com/api";

let authToken: string | null = localStorage.getItem("salon_token");

const getHeaders = () => {
  const token = localStorage.getItem("salon_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: getHeaders(),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Error de conexión" }));
    throw new Error(error.error || "Error en la petición");
  }

  return response.json();
};

// ============ AUTH ============
export const auth = {
  login: async (email: string, password: string) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    authToken = data.token;
    localStorage.setItem("salon_token", data.token);
    localStorage.setItem("salon_user", JSON.stringify(data.user));
    if (data.subscription) {
      localStorage.setItem("salon_subscription", JSON.stringify(data.subscription));
    }
    return data;
  },

  logout: async () => {
    await request("/auth/logout", { method: "POST" }).catch(() => {});
    authToken = null;
    localStorage.removeItem("salon_token");
    localStorage.removeItem("salon_user");
    localStorage.removeItem("salon_subscription");
  },

  me: () => request("/auth/me"),

  signup: async (data: {
    account_name: string;
    branch_name: string;
    admin_name: string;
    admin_email: string;
    admin_password: string;
    admin_phone?: string;
    plan_id?: string;
  }) => {
    const result = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    authToken = result.token;
    localStorage.setItem("salon_token", result.token);
    localStorage.setItem("salon_user", JSON.stringify(result.user));
    if (result.subscription) {
      localStorage.setItem("salon_subscription", JSON.stringify(result.subscription));
    }
    return result;
  },

  verifyAdmin: async (email: string, password: string): Promise<{ success: boolean; admin_name?: string; error?: string }> => {
    try {
      const data = await request("/auth/verify-admin", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return { success: true, admin_name: data.admin_name };
    } catch (err: any) {
      return { success: false, error: err.message || "Credenciales inválidas" };
    }
  },

  getUser: () => {
    const user = localStorage.getItem("salon_user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!authToken,
};

// ============ PLANS (Público) ============
export const plans = {
  getAll: () => request("/plans"),
  getById: (id: string) => request(`/plans/${id}`),
};

// ============ SUBSCRIPTIONS ============
export const subscriptions = {
  getCurrent: () => request("/subscriptions/current"),
  getHistory: () => request("/subscriptions/history"),
  getUsage: () => request("/subscriptions/usage"),
  getPayments: () => request("/subscriptions/payments"),
  addPayment: (data: any) =>
    request("/subscriptions/payments", { method: "POST", body: JSON.stringify(data) }),
  changePlan: (data: { plan_id: string; billing_cycle: string }) =>
    request("/subscriptions/change-plan", { method: "POST", body: JSON.stringify(data) }),
  activate: (data: { billing_cycle: string; payment_reference?: string }) =>
    request("/subscriptions/activate", { method: "POST", body: JSON.stringify(data) }),
  cancel: () => request("/subscriptions/cancel", { method: "POST" }),
};

// ============ ACCOUNTS (Usuario actual) ============
export const accounts = {
  getCurrent: () => request("/accounts/current"),
  updateCurrent: (data: any) =>
    request("/accounts/current", { method: "PUT", body: JSON.stringify(data) }),
  getStats: () => request("/accounts/stats"),
};

// ============ ADMIN (Super Admin) ============
export const admin = {
  getAccounts: () => request("/admin/accounts"),
  getAccountById: (id: string) => request(`/admin/accounts/${id}`),
  createAccount: (data: any) =>
    request("/admin/accounts", { method: "POST", body: JSON.stringify(data) }),
  updateAccount: (id: string, data: any) =>
    request(`/admin/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAccount: (id: string) =>
    request(`/admin/accounts/${id}`, { method: "DELETE" }),
  getSubscription: (accountId: string) =>
    request(`/admin/accounts/${accountId}/subscription`),
  updateSubscription: (accountId: string, data: any) =>
    request(`/admin/accounts/${accountId}/subscription`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  extendTrial: (accountId: string, data?: any) =>
    request(`/admin/accounts/${accountId}/extend-trial`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
  getAccountPayments: (accountId: string) =>
    request(`/admin/accounts/${accountId}/payments`),
  addPayment: (accountId: string, data: any) =>
    request(`/admin/accounts/${accountId}/payments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAllPayments: () => request("/admin/payments"),
  getStats: () => request("/admin/stats"),
};

// ============ BRANCHES ============
export const branches = {
  getAll: () => request("/branches"),
  getById: (id: string) => request(`/branches/${id}`),
  create: (data: any) =>
    request("/branches", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/branches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/branches/${id}`, { method: "DELETE" }),
};

// ============ USERS ============
export const users = {
  getAll: (params?: { branch_id?: string; role?: string; active?: boolean }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/users${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => request(`/users/${id}`),
  create: (data: any) =>
    request("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/users/${id}`, { method: "DELETE" }),
};

// ============ CLIENTS ============
export const clients = {
  getAll: (search?: string) =>
    request(`/clients${search ? `?search=${search}` : ""}`),
  getById: (id: string) => request(`/clients/${id}`),
  getAppointments: (id: string) => request(`/clients/${id}/appointments`),
  create: (data: any) =>
    request("/clients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/clients/${id}`, { method: "DELETE" }),
};

// ============ SERVICES ============
export const services = {
  getAll: (params?: { category?: string; active?: boolean }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/services${query ? `?${query}` : ""}`);
  },
  getCategories: () => request("/services/categories"),
  getById: (id: string) => request(`/services/${id}`),
  create: (data: any) =>
    request("/services", { method: "POST", body: JSON.stringify(data) }),
  createBulk: (services: any[]) =>
    request("/services/bulk", {
      method: "POST",
      body: JSON.stringify({ services }),
    }),
  update: (id: string, data: any) =>
    request(`/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/services/${id}`, { method: "DELETE" }),
};

// ============ PRODUCTS ============
export const products = {
  getAll: (params?: { category?: string; active?: boolean; low_stock?: boolean }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/products${query ? `?${query}` : ""}`);
  },
  getCategories: () => request("/products/categories"),
  getById: (id: string) => request(`/products/${id}`),
  create: (data: any) =>
    request("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStock: (id: string, stock: number) =>
    request(`/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ stock }),
    }),
  delete: (id: string) => request(`/products/${id}`, { method: "DELETE" }),
};

// ============ APPOINTMENTS ============
export const appointments = {
  getAll: (params?: {
    branch_id?: string;
    stylist_id?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/appointments${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => request(`/appointments/${id}`),
  create: (data: any) =>
    request("/appointments", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/appointments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    request(`/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) => request(`/appointments/${id}`, { method: "DELETE" }),
};

// ============ SALES ============
export const sales = {
  getAll: (params?: {
    branch_id?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/sales${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => request(`/sales/${id}`),
  create: (data: any) =>
    request("/sales", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/sales/${id}`, { method: "DELETE" }),
};

// ============ EXPENSES ============
export const expenses = {
  getAll: (params?: {
    branch_id?: string;
    category?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/expenses${query ? `?${query}` : ""}`);
  },
  getCategories: () => request("/expenses/categories"),
  getSummary: (params?: { branch_id?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/expenses/summary${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => request(`/expenses/${id}`),
  create: (data: any) =>
    request("/expenses", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/expenses/${id}`, { method: "DELETE" }),
};

// ============ SUPPLIERS (PROVEEDORES) ============
export const suppliers = {
  getAll: (params?: { active?: boolean; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/suppliers${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => request(`/suppliers/${id}`),
  create: (data: any) =>
    request("/suppliers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/suppliers/${id}`, { method: "DELETE" }),
  getStatement: (id: string, params?: { start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/suppliers/${id}/statement${query ? `?${query}` : ""}`);
  },
  getPending: (id: string) => request(`/suppliers/${id}/pending`),
};

// ============ PURCHASES (COMPRAS) ============
export const purchases = {
  getAll: (params?: {
    branch_id?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
    supplier_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/purchases${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => request(`/purchases/${id}`),
  create: (data: any) =>
    request("/purchases", { method: "POST", body: JSON.stringify(data) }),
  addPayment: (id: string, data: any) =>
    request(`/purchases/${id}/payments`, { method: "POST", body: JSON.stringify(data) }),
  cancel: (id: string) =>
    request(`/purchases/${id}/cancel`, { method: "PATCH" }),
  delete: (id: string) => request(`/purchases/${id}`, { method: "DELETE" }),
};

// ============ INVENTORY ============
export const inventory = {
  getMovements: (params?: {
    branch_id?: string;
    product_id?: string;
    type?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/inventory/movements${query ? `?${query}` : ""}`);
  },
  getStock: (params?: { low_stock?: boolean }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/inventory/stock${query ? `?${query}` : ""}`);
  },
  getValue: () => request("/inventory/value"),
  addIn: (data: any) =>
    request("/inventory/in", { method: "POST", body: JSON.stringify(data) }),
  addOut: (data: any) =>
    request("/inventory/out", { method: "POST", body: JSON.stringify(data) }),
  adjust: (data: any) =>
    request("/inventory/adjustment", { method: "POST", body: JSON.stringify(data) }),
};

// ============ SHIFTS ============
export const shifts = {
  getAll: (params?: {
    branch_id?: string;
    status?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/shifts${query ? `?${query}` : ""}`);
  },
  getOpen: (branch_id: string) =>
    request(`/shifts/open?branch_id=${branch_id}`),
  getById: (id: string) => request(`/shifts/${id}`),
  getSummary: (id: string) => request(`/shifts/${id}/summary`),
  open: (data: any) =>
    request("/shifts/open", { method: "POST", body: JSON.stringify(data) }),
  close: (id: string, final_cash: number) =>
    request(`/shifts/${id}/close`, {
      method: "POST",
      body: JSON.stringify({ final_cash }),
    }),
};

// ============ CASH CUTS ============
export const cashCuts = {
  getAll: (params?: { branch_id?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/cash-cuts${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => request(`/cash-cuts/${id}`),
  create: (data: any) =>
    request("/cash-cuts", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) => request(`/cash-cuts/${id}`, { method: "DELETE" }),
};

// ============ ROLES ============
export const roles = {
  getAll: () => request("/roles"),
  getById: (id: string) => request(`/roles/${id}`),
  create: (data: any) =>
    request("/roles", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request(`/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  duplicate: (id: string) =>
    request(`/roles/${id}/duplicate`, { method: "POST" }),
  delete: (id: string) => request(`/roles/${id}`, { method: "DELETE" }),
  getUsersList: () => request("/roles/users/list"),
  assignRole: (data: any) =>
    request("/roles/users/assign", { method: "POST", body: JSON.stringify(data) }),
  removeRole: (user_id: string) =>
    request(`/roles/users/${user_id}/role`, { method: "DELETE" }),
};

// ============ SCHEDULES ============
export const schedules = {
  getBranch: (branch_id: string) => request(`/schedules/branch/${branch_id}`),
  updateBranch: (branch_id: string, schedule: any) =>
    request(`/schedules/branch/${branch_id}`, {
      method: "PUT",
      body: JSON.stringify({ schedule }),
    }),
  getStylist: (stylist_id: string, branch_id?: string) =>
    request(`/schedules/stylist/${stylist_id}${branch_id ? `?branch_id=${branch_id}` : ""}`),
  updateStylist: (stylist_id: string, data: any) =>
    request(`/schedules/stylist/${stylist_id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getBlocked: (params?: { type?: string; target_id?: string; start_date?: string; end_date?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/schedules/blocked${query ? `?${query}` : ""}`);
  },
  createBlocked: (data: any) =>
    request("/schedules/blocked", { method: "POST", body: JSON.stringify(data) }),
  updateBlocked: (id: string, data: any) =>
    request(`/schedules/blocked/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBlocked: (id: string) =>
    request(`/schedules/blocked/${id}`, { method: "DELETE" }),
};

// ============ CONFIG ============
export const config = {
  get: () => request("/config"),
  update: (data: any) =>
    request("/config", { method: "PUT", body: JSON.stringify(data) }),
};

// ============ DASHBOARD ============
export const dashboard = {
  get: (branch_id?: string) =>
    request(`/dashboard${branch_id ? `?branch_id=${branch_id}` : ""}`),
  getReports: (params: {
    start_date: string;
    end_date: string;
    type: string;
    branch_id?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/dashboard/reports?${query}`);
  },
};

// Export all
export const api = {
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
  cashCuts,
  roles,
  schedules,
  config,
  dashboard,
};

export default api;
