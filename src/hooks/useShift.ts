import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface ShiftUser {
  id: string;
  name: string;
  color: string;
  role?: string;
}

export interface Shift {
  id: string;
  branchId: string;
  userId: string;
  user: ShiftUser;
  date: string;
  startTime: string;
  endTime?: string;
  initialCash: number;
  finalCash?: number;
  status: 'open' | 'closed';
}

interface ShiftContextType {
  shifts: Shift[];
  openShift: Shift | null;
  hasOpenShift: boolean;
  loading: boolean;
  openTurn: (userId: string, initialCash: number, branchId: string) => Promise<Shift | null>;
  closeTurn: (shiftId: string, finalCash: number) => Promise<boolean>;
  getShiftsForBranch: (branchId: string) => Shift[];
  refreshShifts: () => Promise<void>;
}

const normalizeShift = (apiShift: any): Shift => ({
  id: apiShift.id,
  branchId: apiShift.branch_id,
  userId: apiShift.user_id,
  user: {
    id: apiShift.user_id,
    name: apiShift.user_name || apiShift.user?.name || 'Usuario',
    color: apiShift.user_color || apiShift.user?.color || '#3B82F6',
  },
  date: apiShift.date?.split('T')[0] || new Date().toISOString().split('T')[0],
  startTime: apiShift.start_time?.slice(0, 5) || apiShift.startTime || '00:00',
  endTime: apiShift.end_time?.slice(0, 5) || apiShift.endTime,
  initialCash: Number(apiShift.initial_cash ?? apiShift.initialCash ?? 0),
  finalCash: apiShift.final_cash != null ? Number(apiShift.final_cash) : apiShift.finalCash,
  status: apiShift.status || 'closed',
});

export function useShift(branchId: string): ShiftContextType {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [openShift, setOpenShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);

  const loadShifts = useCallback(async () => {
    if (!branchId) return;
    
    setLoading(true);
    try {
      const [allShifts, openShiftData] = await Promise.all([
        api.shifts.getAll({ branch_id: branchId }),
        api.shifts.getOpen(branchId).catch(() => null),
      ]);

      setShifts(allShifts.map(normalizeShift));
      setOpenShift(openShiftData ? normalizeShift(openShiftData) : null);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const hasOpenShift = !!openShift;

  const openTurn = async (userId: string, initialCash: number, bId: string): Promise<Shift | null> => {
    try {
      const result = await api.shifts.open({
        branch_id: bId,
        user_id: userId,
        initial_cash: initialCash,
      });

      const newShift = normalizeShift(result);
      setOpenShift(newShift);
      setShifts(prev => [newShift, ...prev]);
      return newShift;
    } catch (error: any) {
      console.error('Error opening shift:', error);
      toast.error(error.message || 'Error al abrir turno');
      return null;
    }
  };

  const closeTurn = async (shiftId: string, finalCash: number): Promise<boolean> => {
    try {
      await api.shifts.close(shiftId, finalCash);
      
      setShifts(prev => prev.map(s =>
        s.id === shiftId
          ? { ...s, endTime: new Date().toTimeString().slice(0, 5), finalCash, status: 'closed' as const }
          : s
      ));
      setOpenShift(null);
      return true;
    } catch (error: any) {
      console.error('Error closing shift:', error);
      toast.error(error.message || 'Error al cerrar turno');
      return false;
    }
  };

  const getShiftsForBranch = (bId: string) => {
    return shifts.filter(s => s.branchId === bId);
  };

  return {
    shifts,
    openShift,
    hasOpenShift,
    loading,
    openTurn,
    closeTurn,
    getShiftsForBranch,
    refreshShifts: loadShifts,
  };
}
