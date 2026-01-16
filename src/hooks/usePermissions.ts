import {
  useState,
  useEffect,
  createContext,
  useContext,
  createElement,
} from "react";
import type { ReactNode } from "react";
import api from "@/lib/api";

const CURRENT_USER_KEY = "salon_current_user";
const TOKEN_KEY = "salon_token";
const SUBSCRIPTION_KEY = "salon_subscription";

export type ModuleId =
  | "dashboard"
  | "agenda"
  | "pagos"
  | "ventas"
  | "gastos"
  | "compras"
  | "inventario"
  | "servicios"
  | "productos"
  | "turnos"
  | "cortes"
  | "horarios"
  | "configuracion"
  | "permisos"
  | "superadmin";

export type ActionId = "view" | "create" | "edit" | "delete";

export interface ModulePermissions {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  is_system: boolean;
  permissions: Record<ModuleId, ModulePermissions>;
}

export interface UserWithRole {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id?: string;
  account_id?: string;
  color?: string;
  avatar_url?: string;
  active: boolean;
  permissions?: Record<ModuleId, ModulePermissions>;
}

export interface Subscription {
  plan: string;
  plan_id: string;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  billing_cycle?: 'monthly' | 'yearly';
  trial_ends_at?: string;
  ends_at?: string;
  days_remaining?: number;
  max_users?: number;
  max_branches?: number;
  current_users?: number;
  current_branches?: number;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface PermissionsContextType {
  currentUser: UserWithRole | null;
  currentRole: Role | null;
  subscription: Subscription | null;
  users: UserWithRole[];
  roles: Role[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubscriptionExpired: boolean;
  daysRemaining: number | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  setCurrentUserId: (userId: string | null) => void;
  hasPermission: (moduleId: ModuleId, action: ActionId) => boolean;
  canView: (moduleId: ModuleId) => boolean;
  canCreate: (moduleId: ModuleId) => boolean;
  canEdit: (moduleId: ModuleId) => boolean;
  canDelete: (moduleId: ModuleId) => boolean;
  refreshData: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserWithRole | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [subscription, setSubscription] = useState<Subscription | null>(() => {
    try {
      const saved = localStorage.getItem(SUBSCRIPTION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate subscription status
  const isSubscriptionExpired = subscription?.status === 'expired' || 
    (subscription?.days_remaining !== undefined && subscription.days_remaining < 0);
  
  const daysRemaining = subscription?.days_remaining ?? null;

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && currentUser) {
        try {
          const userData = await api.auth.me();

          if (
            userData.permissions &&
            typeof userData.permissions === "string"
          ) {
            userData.permissions = JSON.parse(userData.permissions);
          }

          setCurrentUser(userData);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));

          // Get subscription info
          if (userData.subscription) {
            setSubscription(userData.subscription);
            localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(userData.subscription));
          }

          await refreshData();
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(CURRENT_USER_KEY);
          localStorage.removeItem(SUBSCRIPTION_KEY);
          setCurrentUser(null);
          setSubscription(null);
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const refreshData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        api.users.getAll().catch(() => []),
        api.roles.getAll().catch(() => []),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const refreshCurrentUser = async () => {
    try {
      const userData = await api.auth.me();
      if (userData.permissions && typeof userData.permissions === "string") {
        userData.permissions = JSON.parse(userData.permissions);
      }
      setCurrentUser(userData);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      
      if (userData.subscription) {
        setSubscription(userData.subscription);
        localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(userData.subscription));
      }
    } catch (error) {
      console.error("Error refreshing current user:", error);
    }
  };

  const refreshSubscription = async () => {
    try {
      const subData = await api.subscriptions.getCurrent();
      setSubscription(subData);
      localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subData));
    } catch (error) {
      console.error("Error refreshing subscription:", error);
    }
  };

  const setCurrentUserId = (userId: string | null) => {
    if (!userId) {
      setCurrentUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResult> => {
    try {
      const data = await api.auth.login(email, password);
      if (data.user.permissions && typeof data.user.permissions === "string") {
        data.user.permissions = JSON.parse(data.user.permissions);
      }
      setCurrentUser(data.user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));
      
      if (data.subscription) {
        setSubscription(data.subscription);
        localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(data.subscription));
      }
      
      await refreshData();
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Error al iniciar sesión",
      };
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {}
    setCurrentUser(null);
    setSubscription(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
  };

  const currentRole = currentUser?.permissions
    ? ({
        id: "",
        name: currentUser.role,
        description: "",
        color: "",
        is_system: false,
        permissions: currentUser.permissions,
      } as Role)
    : roles.find(
        (r) => r.name.toLowerCase() === currentUser?.role?.toLowerCase()
      ) || null;

  const isAuthenticated = !!currentUser && !isLoading;

  const hasPermission = (moduleId: ModuleId, action: ActionId): boolean => {
    if (isLoading) return true;
    if (!currentUser) return false;

    // Super admin y admin tienen acceso total
    const userRole = currentUser.role?.toLowerCase();
    if (userRole === "admin" || userRole === "superadmin" || userRole === "super_admin") {
      return true;
    }

    if (currentUser.permissions) {
      if (typeof currentUser.permissions === "string") {
        return false;
      }

      return currentUser.permissions[moduleId]?.[action] === true;
    }

    if (currentRole) {
      return currentRole.permissions[moduleId]?.[action] ?? false;
    }

    return false;
  };

  const canView = (moduleId: ModuleId) => hasPermission(moduleId, "view");
  const canCreate = (moduleId: ModuleId) => hasPermission(moduleId, "create");
  const canEdit = (moduleId: ModuleId) => hasPermission(moduleId, "edit");
  const canDelete = (moduleId: ModuleId) => hasPermission(moduleId, "delete");

  const value: PermissionsContextType = {
    currentUser,
    currentRole,
    subscription,
    users,
    roles,
    isAuthenticated,
    isLoading,
    isSubscriptionExpired,
    daysRemaining,
    login,
    logout,
    setCurrentUserId,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    refreshData,
    refreshCurrentUser,
    refreshSubscription,
  };

  return createElement(PermissionsContext.Provider, { value }, children);
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}
