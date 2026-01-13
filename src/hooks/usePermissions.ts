import { useState, useEffect, createContext, useContext, createElement } from 'react';
import type { ReactNode } from 'react';
import { 
  getRoles, 
  getUsersWithRoles, 
  type Role, 
  type UserWithRole, 
  type ModuleId, 
  type ActionId 
} from '@/lib/permissions';

const CURRENT_USER_KEY = 'salon_current_user';

interface PermissionsContextType {
  currentUser: UserWithRole | null;
  currentRole: Role | null;
  users: UserWithRole[];
  roles: Role[];
  setCurrentUserId: (userId: string | null) => void;
  hasPermission: (moduleId: ModuleId, action: ActionId) => boolean;
  canView: (moduleId: ModuleId) => boolean;
  canCreate: (moduleId: ModuleId) => boolean;
  canEdit: (moduleId: ModuleId) => boolean;
  canDelete: (moduleId: ModuleId) => boolean;
  refreshData: () => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CURRENT_USER_KEY);
    } catch {
      return null;
    }
  });
  
  const [users, setUsers] = useState<UserWithRole[]>(() => getUsersWithRoles());
  const [roles, setRoles] = useState<Role[]>(() => getRoles());

  const refreshData = () => {
    setUsers(getUsersWithRoles());
    setRoles(getRoles());
  };

  useEffect(() => {
    const interval = setInterval(refreshData, 1000);
    return () => clearInterval(interval);
  }, []);

  const setCurrentUserId = (userId: string | null) => {
    setCurrentUserIdState(userId);
    if (userId) {
      localStorage.setItem(CURRENT_USER_KEY, userId);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  const currentUser = currentUserId 
    ? users.find(u => u.id === currentUserId && u.active) || null 
    : null;
    
  const currentRole = currentUser 
    ? roles.find(r => r.id === currentUser.roleId) || null 
    : null;

  const hasPermission = (moduleId: ModuleId, action: ActionId): boolean => {
    if (!currentUser || !currentRole) return true;
    return currentRole.permissions[moduleId]?.[action] ?? false;
  };

  const canView = (moduleId: ModuleId) => hasPermission(moduleId, 'view');
  const canCreate = (moduleId: ModuleId) => hasPermission(moduleId, 'create');
  const canEdit = (moduleId: ModuleId) => hasPermission(moduleId, 'edit');
  const canDelete = (moduleId: ModuleId) => hasPermission(moduleId, 'delete');

  const value: PermissionsContextType = {
    currentUser,
    currentRole,
    users,
    roles,
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
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
