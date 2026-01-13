import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/lib/storage';
import { branches, type Branch } from '@/lib/mockData';
import { getBusinessConfig, setBusinessConfig, terminology, type BusinessConfig, type BusinessType } from '@/lib/businessConfig';

interface AppContextType {
  currentBranch: Branch;
  setCurrentBranchId: (id: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  businessConfig: BusinessConfig;
  updateBusinessConfig: (config: Partial<BusinessConfig>) => void;
  terms: typeof terminology[BusinessType];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentBranchId, setCurrentBranchId] = useState(() => storage.getCurrentBranch());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storage.getTheme());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [businessConfig, setBusinessConfigState] = useState<BusinessConfig>(() => getBusinessConfig());

  const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];
  const terms = terminology[businessConfig.type];

  useEffect(() => {
    storage.setCurrentBranch(currentBranchId);
  }, [currentBranchId]);

  useEffect(() => {
    storage.setTheme(theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
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
        setCurrentBranchId,
        theme,
        toggleTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
        businessConfig,
        updateBusinessConfig,
        terms,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
