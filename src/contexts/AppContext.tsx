import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { storage } from "@/lib/storage";
import type { Branch } from "@/lib/mockData";
import { getBranches } from "@/api/branches";
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

  useEffect(() => {
    const loadBranches = async () => {
      // Only load branches if user is authenticated
      const token = localStorage.getItem("salon_token");
      if (!token) {
        setLoadingBranches(false);
        return;
      }

      try {
        const data = await getBranches();
        setBranches(data);
        if (!currentBranchId && data.length > 0) {
          setCurrentBranchId(data[0].id);
        }
      } catch (error) {
        console.error("Error cargando sucursales", error);
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, []);

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

  const currentBranch =
    branches.find((b) => b.id === currentBranchId) || branches[0];

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

  // Don't block rendering if no branches (user might not be authenticated yet)
  // Components should handle the case when currentBranch is undefined

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
