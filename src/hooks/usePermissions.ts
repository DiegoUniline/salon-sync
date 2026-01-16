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
  color?: string;
  avatar_url?: string;
  active: boolean;
  permissions?: Record<ModuleId, ModulePermissions>;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface PermissionsContextType {
  currentUser: UserWithRole | null;
  currentRole: Role | null;
  users: UserWithRole[];
  roles: Role[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  setCurrentUserId: (userId: string | null) => void;
  hasPermission: (moduleId: ModuleId, action: ActionId) => boolean;
  canView: (moduleId: ModuleId) => boolean;
  canCreate: (moduleId: ModuleId) => boolean;
  canEdit: (moduleId: ModuleId) => boolean;
  canDelete: (moduleId: ModuleId) => boolean;
  refreshData: () => Promise<void>;
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

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

          await refreshData();
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(CURRENT_USER_KEY);
          setCurrentUser(null);
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
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
    users,
    roles,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setCurrentUserId,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    refreshData,
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
