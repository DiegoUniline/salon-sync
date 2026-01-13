import { useState, useEffect, createContext, useContext } from 'react';
import { shifts as mockShifts, stylists, type Shift } from '@/lib/mockData';
import { storage, STORAGE_KEYS } from '@/lib/storage';

const SHIFTS_KEY = 'salon_shifts';

interface ShiftContextType {
  shifts: Shift[];
  openShift: Shift | null;
  hasOpenShift: boolean;
  openTurn: (userId: string, initialCash: number, branchId: string) => Shift | null;
  closeTurn: (shiftId: string, finalCash: number) => boolean;
  getShiftsForBranch: (branchId: string) => Shift[];
}

// Get initial shifts from storage or use mock data
const getInitialShifts = (): Shift[] => {
  return storage.get<Shift[]>(SHIFTS_KEY, mockShifts);
};

export function useShift(branchId: string): ShiftContextType {
  const [shifts, setShifts] = useState<Shift[]>(getInitialShifts);

  // Persist shifts to localStorage
  useEffect(() => {
    storage.set(SHIFTS_KEY, shifts);
  }, [shifts]);

  const getShiftsForBranch = (bId: string) => {
    return shifts.filter(s => s.branchId === bId);
  };

  const openShift = shifts.find(s => s.branchId === branchId && s.status === 'open') || null;
  const hasOpenShift = !!openShift;

  const openTurn = (userId: string, initialCash: number, bId: string): Shift | null => {
    // Check if there's already an open shift for this branch
    const existingOpen = shifts.find(s => s.branchId === bId && s.status === 'open');
    if (existingOpen) return null;

    const user = stylists.find(s => s.id === userId);
    if (!user) return null;

    const now = new Date();
    const newShift: Shift = {
      id: `sh${Date.now()}`,
      branchId: bId,
      userId,
      user,
      date: now.toISOString().split('T')[0],
      startTime: now.toTimeString().slice(0, 5),
      initialCash,
      status: 'open',
    };

    setShifts(prev => [newShift, ...prev]);
    return newShift;
  };

  const closeTurn = (shiftId: string, finalCash: number): boolean => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift || shift.status !== 'open') return false;

    const now = new Date();
    setShifts(prev => prev.map(s =>
      s.id === shiftId
        ? {
            ...s,
            endTime: now.toTimeString().slice(0, 5),
            finalCash,
            status: 'closed' as const,
          }
        : s
    ));
    return true;
  };

  return {
    shifts,
    openShift,
    hasOpenShift,
    openTurn,
    closeTurn,
    getShiftsForBranch,
  };
}
