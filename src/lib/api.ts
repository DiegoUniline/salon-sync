// src/lib/api.ts
const API_URL = "https://tu-salon-api-7a74d0e1632a.herokuapp.com/api";
// const API_URL = "http://localhost:3000/api";

let authToken: string | null = localStorage.getItem("salon_token");

const getHeaders = () => ({
  "Content-Type": "application/json",
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
});

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
    return data;
  },

  logout: async () => {
    await request("/auth/logout", { method: "POST" }).catch(() => {});
    authToken = null;
    localStorage.removeItem("salon_token");
    localStorage.removeItem("salon_user");
  },

  me: () => request("/auth/me"),

  getUser: () => {
    const user = localStorage.getItem("salon_user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => !!authToken,
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
  getAll: (params?: {
    branch_id?: string;
    role?: string;
    active?: boolean;
  }) => {
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
  getAll: (params?: {
    category?: string;
    active?: boolean;
    low_stock?: boolean;
  }) => {
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
    request(`/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
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
  getSummary: (params?: {
    branch_id?: string;
    start_date?: string;
    end_date?: string;
  }) => {
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

// ============ PURCHASES ============
export const purchases = {
  getAll: (params?: {
    branch_id?: string;
    date?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/purchases${query ? `?${query}` : ""}`);
  },
  getById: (id: string) => request(`/purchases/${id}`),
  create: (data: any) =>
    request("/purchases", { method: "POST", body: JSON.stringify(data) }),
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
    request("/inventory/adjustment", {
      method: "POST",
      body: JSON.stringify(data),
    }),
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
  getAll: (params?: {
    branch_id?: string;
    start_date?: string;
    end_date?: string;
  }) => {
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
    request("/roles/users/assign", {
      method: "POST",
      body: JSON.stringify(data),
    }),
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
    request(
      `/schedules/stylist/${stylist_id}${
        branch_id ? `?branch_id=${branch_id}` : ""
      }`
    ),
  updateStylist: (stylist_id: string, data: any) =>
    request(`/schedules/stylist/${stylist_id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getBlocked: (params?: {
    type?: string;
    target_id?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/schedules/blocked${query ? `?${query}` : ""}`);
  },
  createBlocked: (data: any) =>
    request("/schedules/blocked", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateBlocked: (id: string, data: any) =>
    request(`/schedules/blocked/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
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
  branches,
  users,
  clients,
  services,
  products,
  appointments,
  sales,
  expenses,
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
