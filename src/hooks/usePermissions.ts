import {
  useState,
  useEffect,
  createContext,
  useContext,
  createElement,
} from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import api from "@/lib/api";

const CURRENT_USER_KEY = "salon_current_user";
const SUBSCRIPTION_KEY = "salon_subscription";

export type ModuleId =
  | "dashboard"
  | "agenda"
  | "pagos"
  | "ventas"
  | "gastos"
  | "compras"
  | "proveedores"
  | "inventario"
  | "servicios"
  | "productos"
  | "turnos"
  | "cortes"
  | "horarios"
  | "configuracion"
  | "catalogos"
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
  permissions: Record<string, any>;
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
  permissions?: Record<string, any> | null;
}

export interface Subscription {
  plan: string;
  plan_id: string;
  status: string;
  billing_cycle?: string;
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

  const calculateDaysRemaining = (sub: Subscription | null): number | null => {
    if (!sub) return null;
    if (sub.days_remaining !== undefined) return sub.days_remaining;
    const endDate = sub.trial_ends_at || sub.ends_at;
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining(subscription);
  const isSubscriptionExpired = subscription?.status === 'expired' || 
    (daysRemaining !== null && daysRemaining < 0);

  useEffect(() => {
    // Listen for Supabase auth state changes
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Load user data
          try {
            const userData = await api.auth.me();
            const user: UserWithRole = {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              branch_id: userData.branch_id,
              account_id: userData.account_id,
              color: userData.color,
              avatar_url: userData.avatar_url,
              active: userData.active,
              permissions: userData.permissions as any,
            };
            setCurrentUser(user);
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            
            if (userData.subscription) {
              setSubscription(userData.subscription);
              localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(userData.subscription));
            }
            
            await refreshData();
          } catch (error) {
            console.error('Error loading user after sign in:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          setSubscription(null);
          localStorage.removeItem(CURRENT_USER_KEY);
          localStorage.removeItem(SUBSCRIPTION_KEY);
        }
        setIsLoading(false);
      }
    );

    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          const userData = await api.auth.me();
          const user: UserWithRole = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            branch_id: userData.branch_id,
            account_id: userData.account_id,
            color: userData.color,
            avatar_url: userData.avatar_url,
            active: userData.active,
              permissions: userData.permissions as any,
          };
          setCurrentUser(user);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
          
          if (userData.subscription) {
            setSubscription(userData.subscription);
            localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(userData.subscription));
          }
          
          await refreshData();
        } catch (error) {
          console.error('Session expired:', error);
          setCurrentUser(null);
          localStorage.removeItem(CURRENT_USER_KEY);
          localStorage.removeItem(SUBSCRIPTION_KEY);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem(CURRENT_USER_KEY);
        localStorage.removeItem(SUBSCRIPTION_KEY);
      }
      setIsLoading(false);
    };
    
    checkSession();

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  const refreshData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        api.users.getAll().catch(() => []),
        api.roles.getAll().catch(() => []),
      ]);
      setUsers(usersData as any);
      setRoles(rolesData as any);
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const refreshCurrentUser = async () => {
    try {
      const userData = await api.auth.me();
      const user: UserWithRole = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        branch_id: userData.branch_id,
        account_id: userData.account_id,
        color: userData.color,
        avatar_url: userData.avatar_url,
        active: userData.active,
        permissions: userData.permissions as any,
      };
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      
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
      setSubscription(subData as any);
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

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const data = await api.auth.login(email, password);
      const user: UserWithRole = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        branch_id: data.user.branch_id,
        account_id: data.user.account_id,
        color: data.user.color,
        avatar_url: data.user.avatar_url,
        active: data.user.active,
        permissions: data.user.permissions as any,
      };
      setCurrentUser(user);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      
      if (data.subscription) {
        setSubscription(data.subscription);
        localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(data.subscription));
      }
      
      window.dispatchEvent(new Event('auth-state-change'));
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
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
    window.dispatchEvent(new Event('auth-state-change'));
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

    const userRole = currentUser.role?.toLowerCase();
    if (userRole === "admin" || userRole === "administrador" || userRole === "superadmin" || 
        userRole === "super_admin" || userRole === "super admin" || userRole === "account_admin") {
      return true;
    }

    if (currentUser.permissions) {
      if (typeof currentUser.permissions === "string") return false;
      return (currentUser.permissions as any)[moduleId]?.[action] === true;
    }

    if (currentRole) {
      return (currentRole.permissions as any)[moduleId]?.[action] ?? false;
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
