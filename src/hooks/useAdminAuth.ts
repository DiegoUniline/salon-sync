import { useState, useCallback } from "react";
import { usePermissions } from "./usePermissions";

export type RestrictedAction =
  | "edit_completed_appointment"
  | "edit_cancelled_appointment"
  | "delete_appointment"
  | "change_status_from_completed"
  | "edit_processed_payment"
  | "delete_payment";

interface AdminAuthState {
  isOpen: boolean;
  action: string;
  description: string;
  onAuthorized: (() => void) | null;
}

const ACTION_DESCRIPTIONS: Record<RestrictedAction, string> = {
  edit_completed_appointment: "Editar cita completada",
  edit_cancelled_appointment: "Editar cita cancelada",
  delete_appointment: "Eliminar cita",
  change_status_from_completed: "Cambiar estado de cita completada",
  edit_processed_payment: "Editar pago procesado",
  delete_payment: "Eliminar pago",
};

export function useAdminAuth() {
  const { currentUser } = usePermissions();
  const [authState, setAuthState] = useState<AdminAuthState>({
    isOpen: false,
    action: "",
    description: "",
    onAuthorized: null,
  });

  // Check if user is admin (bypasses auth requirement)
  const isAdmin = useCallback(() => {
    if (!currentUser) return false;
    const role = currentUser.role?.toLowerCase();
    return (
      role === "admin" ||
      role === "administrador" ||
      role === "superadmin" ||
      role === "super_admin" ||
      role === "super admin"
    );
  }, [currentUser]);

  // Check if a specific status requires authorization
  const isStatusRestricted = useCallback(
    (status: string): boolean => {
      if (isAdmin()) return false;
      return status === "completed" || status === "cancelled";
    },
    [isAdmin]
  );

  // Check if an action on a record with given status requires auth
  const requiresAuth = useCallback(
    (action: RestrictedAction, status?: string): boolean => {
      if (isAdmin()) return false;

      switch (action) {
        case "edit_completed_appointment":
          return status === "completed";
        case "edit_cancelled_appointment":
          return status === "cancelled";
        case "delete_appointment":
          return true; // Always requires confirmation + auth if not admin
        case "change_status_from_completed":
          return status === "completed";
        case "edit_processed_payment":
        case "delete_payment":
          return true; // Payment modifications always require auth
        default:
          return false;
      }
    },
    [isAdmin]
  );

  // Request authorization for an action
  const requestAuth = useCallback(
    (
      action: RestrictedAction,
      onAuthorized: () => void,
      customDescription?: string
    ) => {
      // If user is admin, execute directly
      if (isAdmin()) {
        onAuthorized();
        return;
      }

      setAuthState({
        isOpen: true,
        action,
        description: customDescription || ACTION_DESCRIPTIONS[action] || action,
        onAuthorized,
      });
    },
    [isAdmin]
  );

  // Execute action with auth check
  const withAuth = useCallback(
    (
      action: RestrictedAction,
      status: string | undefined,
      callback: () => void,
      customDescription?: string
    ) => {
      if (requiresAuth(action, status)) {
        requestAuth(action, callback, customDescription);
      } else {
        callback();
      }
    },
    [requiresAuth, requestAuth]
  );

  // Close the auth modal
  const closeAuthModal = useCallback(() => {
    setAuthState((prev) => ({
      ...prev,
      isOpen: false,
      onAuthorized: null,
    }));
  }, []);

  // Execute the authorized action
  const executeAuthorized = useCallback(() => {
    if (authState.onAuthorized) {
      authState.onAuthorized();
    }
    closeAuthModal();
  }, [authState.onAuthorized, closeAuthModal]);

  return {
    isAdmin,
    isStatusRestricted,
    requiresAuth,
    requestAuth,
    withAuth,
    authModalOpen: authState.isOpen,
    authDescription: authState.description,
    closeAuthModal,
    executeAuthorized,
  };
}
