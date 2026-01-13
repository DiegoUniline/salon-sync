// LocalStorage utilities for data persistence

const STORAGE_KEYS = {
  BRANCH: 'salon_current_branch',
  THEME: 'salon_theme',
  APPOINTMENTS: 'salon_appointments',
  SERVICES: 'salon_services',
  PRODUCTS: 'salon_products',
  CLIENTS: 'salon_clients',
  EXPENSES: 'salon_expenses',
  SALES: 'salon_sales',
  SHIFTS: 'salon_shifts',
} as const;

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  // Specific getters/setters
  getCurrentBranch: () => storage.get<string>(STORAGE_KEYS.BRANCH, 'b1'),
  setCurrentBranch: (branchId: string) => storage.set(STORAGE_KEYS.BRANCH, branchId),

  getTheme: () => storage.get<'light' | 'dark'>(STORAGE_KEYS.THEME, 'light'),
  setTheme: (theme: 'light' | 'dark') => storage.set(STORAGE_KEYS.THEME, theme),
};

export { STORAGE_KEYS };
