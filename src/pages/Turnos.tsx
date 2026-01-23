import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import api from '@/lib/api';
import { useShift } from '@/hooks/useShift';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Clock,
  User,
  Calendar,
  PlayCircle,
  StopCircle,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  LogIn,
  LogOut,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Scissors,
  Receipt,
  Calculator,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const paymentMethodConfig = {
  cash: { label: 'Efectivo', icon: Banknote, color: 'text-green-600', bg: 'bg-green-500/10' },
  card: { label: 'Tarjeta', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  transfer: { label: 'Transferencia', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-500/10' },
};

type PaymentMethod = keyof typeof paymentMethodConfig;

interface ShiftSummary {
  salesByMethod: Record<PaymentMethod, number>;
  totalSales: number;
  appointmentSalesCount: number;
  directSalesCount: number;
  expensesByMethod: Record<PaymentMethod, number>;
  totalExpenses: number;
  purchasesByMethod: Record<PaymentMethod, number>;
  totalPurchases: number;
  expectedByMethod: Record<PaymentMethod, number>;
  completedAppointments: number;
  usedMethods: PaymentMethod[];
}

interface UserOption {
  id: string;
  name: string;
  color: string;
}

export default function Turnos() {
  const { currentBranch } = useApp();
  const { shifts, openShift, hasOpenShift, openTurn, closeTurn, getShiftsForBranch, loading: shiftsLoading } = useShift(currentBranch?.id || '');
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [openFormData, setOpenFormData] = useState({
    userId: '',
    initialCash: '',
  });

  const [realAmounts, setRealAmounts] = useState<Record<PaymentMethod, string>>({
    cash: '',
    card: '',
    transfer: '',
  });

  // Step for close dialog: 'input' = enter amounts, 'summary' = show readonly result
  const [closeStep, setCloseStep] = useState<'input' | 'summary'>('input');
  const [closedSummaryData, setClosedSummaryData] = useState<{
    shiftSummary: ShiftSummary;
    realAmounts: Record<PaymentMethod, number>;
    differences: Record<PaymentMethod, number>;
    totalDifference: number;
  } | null>(null);

  const filteredShifts = getShiftsForBranch(currentBranch?.id || '');

  // Load users for the select - fetch all and filter locally to avoid timing issues
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setUsersLoading(true);
        // Fetch all users first, then filter by branch
        const data = await api.users.getAll();
        const allUsers = data.users || data || [];
        
        // Filter by current branch if available, otherwise show all
        const filteredUsers = currentBranch?.id 
          ? allUsers.filter((u: any) => !u.branch_id || u.branch_id === currentBranch.id)
          : allUsers;
        
        setUsers(filteredUsers.map((u: any) => ({
          id: u.id,
          name: u.name || u.full_name,
          color: u.color || '#3B82F6',
        })));
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Error al cargar usuarios');
      } finally {
        setUsersLoading(false);
      }
    };
    
    // Always load users, even before branch is selected
    loadUsers();
  }, [currentBranch?.id]);

  // Load shift summary when opening close dialog
  useEffect(() => {
    const loadSummary = async () => {
      if (!openShift || !isCloseDialogOpen) return;
      
      setSummaryLoading(true);
      try {
        const data = await api.shifts.getSummary(openShift.id);
        
        // Normalize API response
        const salesByMethod: Record<PaymentMethod, number> = {
          cash: data.sales_by_method?.cash || 0,
          card: data.sales_by_method?.card || 0,
          transfer: data.sales_by_method?.transfer || 0,
        };
        const expensesByMethod: Record<PaymentMethod, number> = {
          cash: data.expenses_by_method?.cash || 0,
          card: data.expenses_by_method?.card || 0,
          transfer: data.expenses_by_method?.transfer || 0,
        };
        const purchasesByMethod: Record<PaymentMethod, number> = {
          cash: data.purchases_by_method?.cash || 0,
          card: data.purchases_by_method?.card || 0,
          transfer: data.purchases_by_method?.transfer || 0,
        };
        
        const expectedByMethod: Record<PaymentMethod, number> = {
          cash: openShift.initialCash + salesByMethod.cash - expensesByMethod.cash - purchasesByMethod.cash,
          card: salesByMethod.card - expensesByMethod.card - purchasesByMethod.card,
          transfer: salesByMethod.transfer - expensesByMethod.transfer - purchasesByMethod.transfer,
        };

        const totalSales = Object.values(salesByMethod).reduce((sum, v) => sum + v, 0);
        const totalExpenses = Object.values(expensesByMethod).reduce((sum, v) => sum + v, 0);
        const totalPurchases = Object.values(purchasesByMethod).reduce((sum, v) => sum + v, 0);

        const usedMethods = (Object.keys(paymentMethodConfig) as PaymentMethod[]).filter(method => 
          salesByMethod[method] > 0 || 
          expensesByMethod[method] > 0 ||
          purchasesByMethod[method] > 0 ||
          method === 'cash'
        );

        setShiftSummary({
          salesByMethod,
          totalSales,
          appointmentSalesCount: data.appointment_sales_count || 0,
          directSalesCount: data.direct_sales_count || 0,
          expensesByMethod,
          totalExpenses,
          purchasesByMethod,
          totalPurchases,
          expectedByMethod,
          completedAppointments: data.completed_appointments || 0,
          usedMethods,
        });
      } catch (error) {
        console.error('Error loading shift summary:', error);
        // Fallback to empty summary
        setShiftSummary({
          salesByMethod: { cash: 0, card: 0, transfer: 0 },
          totalSales: 0,
          appointmentSalesCount: 0,
          directSalesCount: 0,
          expensesByMethod: { cash: 0, card: 0, transfer: 0 },
          totalExpenses: 0,
          purchasesByMethod: { cash: 0, card: 0, transfer: 0 },
          totalPurchases: 0,
          expectedByMethod: { cash: openShift?.initialCash || 0, card: 0, transfer: 0 },
          completedAppointments: 0,
          usedMethods: ['cash'],
        });
      } finally {
        setSummaryLoading(false);
      }
    };
    
    loadSummary();
  }, [openShift, isCloseDialogOpen]);

  const handleOpenTurn = async () => {
    if (!openFormData.userId || !openFormData.initialCash) {
      toast.error('Completa los campos requeridos');
      return;
    }

    const result = await openTurn(
      openFormData.userId,
      parseFloat(openFormData.initialCash),
      currentBranch.id
    );

    if (result) {
      toast.success('Turno abierto correctamente');
      setIsOpenDialogOpen(false);
      setOpenFormData({ userId: '', initialCash: '' });
    }
  };

  const handleCloseTurn = async () => {
    if (!openShift || !shiftSummary) {
      toast.error('No hay turno activo');
      return;
    }

    if (!realAmounts.cash) {
      toast.error('Ingresa al menos el efectivo en caja');
      return;
    }

    // Calculate total difference
    let totalDiff = 0;
    const differences: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 };
    const realAmountsNum: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 };
    
    shiftSummary.usedMethods.forEach(method => {
      const real = parseFloat(realAmounts[method]) || 0;
      realAmountsNum[method] = real;
      const expected = shiftSummary.expectedByMethod[method];
      differences[method] = real - expected;
      totalDiff += differences[method];
    });

    const finalCash = parseFloat(realAmounts.cash) || 0;

    // Create cash cut via API
    try {
      await api.cashCuts.create({
        shift_id: openShift.id,
        branch_id: currentBranch.id,
        date: openShift.date,
        user_id: openShift.userId,
        initial_cash: openShift.initialCash,
        final_cash: finalCash,
        expected_cash: shiftSummary.expectedByMethod.cash,
        difference: totalDiff,
        sales_by_method: shiftSummary.salesByMethod,
        total_sales: shiftSummary.totalSales,
        total_expenses: shiftSummary.totalExpenses,
        appointments_count: shiftSummary.completedAppointments,
        direct_sales_count: shiftSummary.directSalesCount,
      });
    } catch (error) {
      console.error('Error creating cash cut:', error);
    }

    // Close the shift
    const success = await closeTurn(openShift.id, finalCash);

    if (success) {
      setClosedSummaryData({
        shiftSummary: { ...shiftSummary },
        realAmounts: realAmountsNum,
        differences,
        totalDifference: totalDiff,
      });
      setCloseStep('summary');
      toast.success('Turno cerrado correctamente');
    }
  };

  const handleCloseDialog = () => {
    setIsCloseDialogOpen(false);
    setRealAmounts({ cash: '', card: '', transfer: '' });
    setCloseStep('input');
    setClosedSummaryData(null);
    setShiftSummary(null);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Format date without timezone conversion issues
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // If it's just a date string (YYYY-MM-DD), parse it as local
    if (dateStr.length === 10) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('es-MX');
    }
    // For ISO strings, extract just the date part to avoid timezone shift
    const datePart = dateStr.split('T')[0];
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-MX');
  };

  if (shiftsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Turnos</h1>
          <p className="text-muted-foreground">Control de apertura y cierre de turnos</p>
        </div>
        <div className="flex gap-2">
          {!openShift ? (
            <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-bg border-0">
                  <LogIn className="h-4 w-4 mr-2" />
                  Abrir Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Turno</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Responsable</Label>
                    <Select 
                      value={openFormData.userId} 
                      onValueChange={(v) => setOpenFormData(prev => ({ ...prev, userId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        {usersLoading ? (
                          <div className="p-2 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        ) : (
                          users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: user.color }} />
                                {user.name}
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Efectivo Inicial en Caja</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        value={openFormData.initialCash}
                        onChange={(e) => setOpenFormData(prev => ({ ...prev, initialCash: e.target.value }))}
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-secondary/50 rounded-lg text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Fecha: {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                      <Clock className="h-4 w-4" />
                      <span>Hora: {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsOpenDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      className="gradient-bg border-0"
                      onClick={handleOpenTurn}
                      disabled={!openFormData.userId || !openFormData.initialCash}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Abrir Turno
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button 
              variant="destructive"
              onClick={() => setIsCloseDialogOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Turno
            </Button>
          )}
        </div>
      </div>

      {/* Current Shift Status */}
      {openShift && (
        <div className="glass-card rounded-xl p-6 border-2 border-success/30 bg-success/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-success/20 animate-pulse">
              <Clock className="h-6 w-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Turno Activo</h3>
              <p className="text-muted-foreground">Iniciado a las {formatTime(openShift.startTime)}</p>
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <User className="h-4 w-4" />
                <span className="text-sm">Responsable</span>
              </div>
              <p className="font-semibold">{openShift.user.name}</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Fecha</span>
              </div>
              <p className="font-semibold">{formatDate(openShift.date)}</p>
            </div>
            <div className="p-4 bg-background/50 rounded-lg">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Banknote className="h-4 w-4" />
                <span className="text-sm">Efectivo Inicial</span>
              </div>
              <p className="font-semibold">${openShift.initialCash.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {!openShift && (
        <div className="glass-card rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-warning" />
          <h3 className="text-lg font-semibold mb-1">No hay turno activo</h3>
          <p className="text-muted-foreground">Abre un turno para comenzar a registrar ventas y gastos</p>
        </div>
      )}

      {/* Shifts History */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Historial de Turnos</h3>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y">
          {filteredShifts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No hay turnos registrados
            </div>
          ) : (
            filteredShifts
              .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
              .map((shift) => (
                <div key={shift.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: shift.user.color }}
                      >
                        {shift.user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{shift.user.name}</p>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(shift.date)}
                        </div>
                      </div>
                    </div>
                    {shift.status === 'open' ? (
                      <Badge className="bg-success/20 text-success border-success/30 gap-1">
                        <PlayCircle className="h-3 w-3" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Cerrado
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-secondary/30 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground text-xs">Horario</p>
                      <p className="font-medium">{formatTime(shift.startTime)}</p>
                      {shift.endTime && <p className="text-muted-foreground text-xs">→ {formatTime(shift.endTime)}</p>}
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground text-xs">Inicial</p>
                      <p className="font-medium">${shift.initialCash.toLocaleString()}</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-2 text-center">
                      <p className="text-muted-foreground text-xs">Final</p>
                      <p className="font-medium">
                        {shift.finalCash !== undefined ? `$${shift.finalCash.toLocaleString()}` : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
        
        {/* Desktop Table */}
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Horario</TableHead>
              <TableHead className="text-right">Efectivo Inicial</TableHead>
              <TableHead className="text-right">Efectivo Final</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShifts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay turnos registrados
                </TableCell>
              </TableRow>
            ) : (
              filteredShifts
                .sort((a, b) => `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`))
                .map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(shift.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: shift.user.color }}
                        />
                        {shift.user.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatTime(shift.startTime)}</span>
                        {shift.endTime && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <span>{formatTime(shift.endTime)}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${shift.initialCash.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {shift.finalCash !== undefined ? (
                        `$${shift.finalCash.toLocaleString()}`
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {shift.status === 'open' ? (
                        <Badge className="bg-success/20 text-success border-success/30 gap-1">
                          <PlayCircle className="h-3 w-3" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Cerrado
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Close Turn Dialog - TWO STEPS */}
      <Dialog open={isCloseDialogOpen} onOpenChange={(open) => {
        if (!open) handleCloseDialog();
        else setIsCloseDialogOpen(true);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {closeStep === 'input' ? 'Cerrar Turno' : 'Resumen del Corte'}
            </DialogTitle>
          </DialogHeader>
          
          {/* STEP 1: Input amounts only */}
          {closeStep === 'input' && openShift && (
            <div className="space-y-4 py-4">
              {summaryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : shiftSummary && (
                <>
                  {/* Shift Info */}
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{openShift.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(openShift.date).toLocaleDateString('es-MX', { 
                            weekday: 'long', 
                            day: 'numeric', 
                            month: 'long' 
                          })} • {formatTime(openShift.startTime)} - Ahora
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Caja inicial:</span>
                      <span className="font-medium">${openShift.initialCash.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Real Amount Inputs */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      ¿Cuánto tienes en caja por cada método?
                    </h4>
                    
                    <div className="grid gap-3">
                      {shiftSummary.usedMethods.map(method => {
                        const config = paymentMethodConfig[method];
                        const Icon = config.icon;
                        
                        return (
                          <div key={method} className={cn("p-3 rounded-lg border", config.bg)}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={cn("h-5 w-5", config.color)} />
                              <span className="font-medium">{config.label}</span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                value={realAmounts[method]}
                                onChange={(e) => setRealAmounts(prev => ({ 
                                  ...prev, 
                                  [method]: e.target.value 
                                }))}
                                className="pl-7 bg-background"
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Cancelar
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleCloseTurn}
                      disabled={!realAmounts.cash}
                    >
                      <StopCircle className="h-4 w-4 mr-2" />
                      Cerrar Turno
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* STEP 2: Summary - Read Only */}
          {closeStep === 'summary' && closedSummaryData && (
            <div className="space-y-4 py-4">
              {/* Success Banner */}
              <div className="p-4 bg-success/10 border border-success/30 rounded-lg text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                <p className="font-semibold text-success">Turno cerrado correctamente</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-success/10 rounded-lg text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
                  <p className="text-xs text-muted-foreground">Ventas</p>
                  <p className="font-bold text-success">${closedSummaryData.shiftSummary?.totalSales.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg text-center">
                  <TrendingDown className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-xs text-muted-foreground">Gastos</p>
                  <p className="font-bold text-destructive">${closedSummaryData.shiftSummary?.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-lg text-center">
                  <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <p className="text-xs text-muted-foreground">Compras</p>
                  <p className="font-bold text-warning">${closedSummaryData.shiftSummary?.totalPurchases.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <Scissors className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Citas</p>
                  <p className="font-bold">{closedSummaryData.shiftSummary?.completedAppointments}</p>
                </div>
              </div>

              {/* Detailed Breakdown by Method */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  Desglose por Método de Pago
                </h4>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/30">
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right text-success">Ventas</TableHead>
                        <TableHead className="text-right text-destructive">Gastos</TableHead>
                        <TableHead className="text-right text-warning">Compras</TableHead>
                        <TableHead className="text-right">Esperado</TableHead>
                        <TableHead className="text-right">Real</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {closedSummaryData.shiftSummary?.usedMethods.map(method => {
                        const config = paymentMethodConfig[method];
                        const Icon = config.icon;
                        const expected = closedSummaryData.shiftSummary?.expectedByMethod[method] || 0;
                        const real = closedSummaryData.realAmounts[method];
                        const diff = closedSummaryData.differences[method];
                        return (
                          <TableRow key={method}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", config.color)} />
                                <span>{config.label}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-success">
                              +${closedSummaryData.shiftSummary?.salesByMethod[method].toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-destructive">
                              -${closedSummaryData.shiftSummary?.expensesByMethod[method].toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-warning">
                              -${closedSummaryData.shiftSummary?.purchasesByMethod[method].toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${expected.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${real.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className={cn(
                                "min-w-[70px] justify-center",
                                diff === 0
                                  ? "bg-success/20 text-success border-success/30"
                                  : diff > 0
                                    ? "bg-info/20 text-info border-info/30"
                                    : "bg-destructive/20 text-destructive border-destructive/30"
                              )}>
                                {diff >= 0 ? '+' : ''}${diff.toLocaleString()}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total Difference */}
              <div className={cn(
                "p-4 rounded-lg border-2",
                closedSummaryData.totalDifference === 0
                  ? "bg-success/10 border-success/30"
                  : closedSummaryData.totalDifference > 0
                    ? "bg-info/10 border-info/30"
                    : "bg-destructive/10 border-destructive/30"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {closedSummaryData.totalDifference === 0 
                      ? <CheckCircle className="h-5 w-5 text-success" />
                      : <AlertTriangle className="h-5 w-5 text-warning" />
                    }
                    <span className="font-medium">Diferencia Total:</span>
                  </div>
                  <span className={cn(
                    "text-xl font-bold",
                    closedSummaryData.totalDifference === 0
                      ? "text-success"
                      : closedSummaryData.totalDifference > 0
                        ? "text-info"
                        : "text-destructive"
                  )}>
                    {closedSummaryData.totalDifference >= 0 ? '+' : ''}${closedSummaryData.totalDifference.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleCloseDialog}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Listo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
