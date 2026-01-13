import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '@/lib/storage';
import { branches, type Branch } from '@/lib/mockData';

interface AppContextType {
  currentBranch: Branch;
  setCurrentBranchId: (id: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentBranchId, setCurrentBranchId] = useState(() => storage.getCurrentBranch());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storage.getTheme());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const currentBranch = branches.find(b => b.id === currentBranchId) || branches[0];

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

  return (
    <AppContext.Provider
      value={{
        currentBranch,
        setCurrentBranchId,
        theme,
        toggleTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
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
