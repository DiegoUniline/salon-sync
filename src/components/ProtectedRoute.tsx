import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import type { ModuleId } from '@/lib/permissions';
import type { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  moduleId: ModuleId;
}

export function ProtectedRoute({ children, moduleId }: ProtectedRouteProps) {
  const { canView, currentUser } = usePermissions();
  const location = useLocation();

  // If no user is logged in, allow access (demo mode)
  if (!currentUser) {
    return <>{children}</>;
  }

  // If user doesn't have permission, redirect to dashboard or show access denied
  if (!canView(moduleId)) {
    // Try to redirect to dashboard if they have access, otherwise show message
    if (canView('dashboard')) {
      return <Navigate to="/" replace />;
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground max-w-md">
          No tienes permisos para acceder a este módulo. 
          Contacta al administrador si crees que esto es un error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
