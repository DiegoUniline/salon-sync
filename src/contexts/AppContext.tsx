import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { storage } from "@/lib/storage";
import type { Branch } from "@/lib/mockData";
import api from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import {
  getBusinessConfig,
  setBusinessConfig,
  terminology,
  type BusinessConfig,
  type BusinessType,
} from "@/lib/businessConfig";

interface AppContextType {
  currentBranch: Branch | null;
  setCurrentBranchId: (id: string) => void;
  branches: Branch[];
  theme: "light" | "dark";
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  businessConfig: BusinessConfig;
  updateBusinessConfig: (config: Partial<BusinessConfig>) => void;
  terms: (typeof terminology)[BusinessType];
  isLoadingBranches: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [currentBranchId, setCurrentBranchId] = useState(() =>
    storage.getCurrentBranch()
  );
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    storage.getTheme()
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [businessConfig, setBusinessConfigState] = useState<BusinessConfig>(
    () => getBusinessConfig()
  );

  const loadBranches = async () => {
    // Only fetch when there is a real Supabase session — otherwise the landing
    // page fires anonymous 401s that pollute the network log.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setBranches([]);
      setLoadingBranches(false);
      return;
    }
    try {
      const data = await api.branches.getAll();
      setBranches(data as any);
      setCurrentBranchId((prev) => prev || (data.length > 0 ? data[0].id : prev));
    } catch (error: any) {
      setBranches([]);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    const handleStorageChange = () => {
      loadBranches();
    };

    loadBranches();
    const { data: authSub } = supabase.auth.onAuthStateChange(() => {
      loadBranches();
    });

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-state-change', handleStorageChange);

    return () => {
      authSub?.subscription?.unsubscribe?.();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-state-change', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentBranch =
    branches.find((b) => b.id === currentBranchId) || branches[0] || null;

  const terms = terminology[businessConfig.type];

  useEffect(() => {
    storage.setCurrentBranch(currentBranchId);
  }, [currentBranchId]);

  useEffect(() => {
    storage.setTheme(theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const updateBusinessConfig = (config: Partial<BusinessConfig>) => {
    const newConfig = { ...businessConfig, ...config };
    setBusinessConfigState(newConfig);
    setBusinessConfig(newConfig);
  };

  return (
    <AppContext.Provider
      value={{
        currentBranch,
        branches,
        setCurrentBranchId,
        theme,
        toggleTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
        businessConfig,
        updateBusinessConfig,
        terms,
        isLoadingBranches: loadingBranches,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
