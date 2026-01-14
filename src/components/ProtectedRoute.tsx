import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import type { ModuleId } from "@/lib/permissions";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  moduleId: ModuleId;
}

export function ProtectedRoute({ children, moduleId }: ProtectedRouteProps) {
  const { canView, currentUser, isLoading } = usePermissions();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return <>{children}</>;
  }

  if (!canView(moduleId)) {
    if (canView("dashboard")) {
      return <Navigate to="/" replace />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
        <p className="text-muted-foreground max-w-md">
          No tienes permisos para acceder a este módulo.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
