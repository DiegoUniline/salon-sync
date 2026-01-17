import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import api from '@/lib/api';
import { useShift } from '@/hooks/useShift';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Calculator,
  Calendar,
  User,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Receipt,
  Scissors,
  ShoppingBag,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const paymentMethodConfig = {
  cash: { label: 'Efectivo', icon: Banknote, color: 'text-green-600', bg: 'bg-green-500/10' },
  card: { label: 'Tarjeta', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  transfer: { label: 'Transferencia', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-500/10' },
};

type PaymentMethod = keyof typeof paymentMethodConfig;

interface CashCut {
  id: string;
  shift_id: string;
  branch_id: string;
  date: string;
  user_id: string;
  user: {
    id: string;
    name: string;
    color: string;
  };
  initial_cash: number;
  final_cash: number;
  expected_cash: number;
  difference: number;
  sales_by_method: Record<PaymentMethod, number>;
  total_sales: number;
  total_expenses: number;
  appointments_count: number;
  direct_sales_count: number;
}

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
}

export default function Cortes() {
  const { currentBranch } = useApp();
  const { shifts, getShiftsForBranch, loading: shiftsLoading } = useShift(currentBranch?.id || '');
  const isMobile = useIsMobile();
  const [cashCuts, setCashCuts] = useState<CashCut[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingCut, setViewingCut] = useState<CashCut | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedSummary, setSelectedSummary] = useState<ShiftSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [realAmounts, setRealAmounts] = useState<Record<PaymentMethod, string>>({
    cash: '',
    card: '',
    transfer: '',
  });

  // Load cash cuts from API
  useEffect(() => {
    const loadCashCuts = async () => {
      if (!currentBranch?.id) return;
      setLoading(true);
      try {
        const data = await api.cashCuts.getAll({ branch_id: currentBranch.id });
        setCashCuts(data.map((c: any) => ({
          ...c,
          user: c.user || { id: c.user_id, name: 'Usuario', color: '#3B82F6' },
          sales_by_method: c.sales_by_method || { cash: 0, card: 0, transfer: 0 },
        })));
      } catch (error) {
        console.error('Error loading cash cuts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCashCuts();
  }, [currentBranch?.id]);

  const allShifts = getShiftsForBranch(currentBranch?.id || '');
  const closedShifts = allShifts.filter(s => s.status === 'closed');
  const cutShiftIds = new Set(cashCuts.map(c => c.shift_id));
  const pendingShifts = closedShifts.filter(s => !cutShiftIds.has(s.id));

  // Load shift summary when selecting a shift
  useEffect(() => {
    const loadSummary = async () => {
      if (!selectedShiftId) {
        setSelectedSummary(null);
        return;
      }

      const shift = allShifts.find(s => s.id === selectedShiftId);
      if (!shift) return;

      setSummaryLoading(true);
      try {
        const data = await api.shifts.getSummary(selectedShiftId);
        console.log('[Cortes] Shift Summary Raw para turno', selectedShiftId, ':', data);
        
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
          cash: shift.initialCash + salesByMethod.cash - expensesByMethod.cash - purchasesByMethod.cash,
          card: salesByMethod.card - expensesByMethod.card - purchasesByMethod.card,
          transfer: salesByMethod.transfer - expensesByMethod.transfer - purchasesByMethod.transfer,
        };

        const totalSales = Object.values(salesByMethod).reduce((sum, v) => sum + v, 0);
        const totalExpenses = Object.values(expensesByMethod).reduce((sum, v) => sum + v, 0);
        const totalPurchases = Object.values(purchasesByMethod).reduce((sum, v) => sum + v, 0);

        setSelectedSummary({
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
        });
      } catch (error) {
        console.error('Error loading shift summary:', error);
        const shift = allShifts.find(s => s.id === selectedShiftId);
        setSelectedSummary({
          salesByMethod: { cash: 0, card: 0, transfer: 0 },
          totalSales: 0,
          appointmentSalesCount: 0,
          directSalesCount: 0,
          expensesByMethod: { cash: 0, card: 0, transfer: 0 },
          totalExpenses: 0,
          purchasesByMethod: { cash: 0, card: 0, transfer: 0 },
          totalPurchases: 0,
          expectedByMethod: { cash: shift?.initialCash || 0, card: 0, transfer: 0 },
          completedAppointments: 0,
        });
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [selectedShiftId, allShifts]);

  // Reset real amounts when shift changes
  useEffect(() => {
    setRealAmounts({ cash: '', card: '', transfer: '' });
  }, [selectedShiftId]);

  const handleSubmit = async () => {
    if (!selectedSummary || !selectedShiftId) {
      toast.error('Selecciona un turno');
      return;
    }

    const shift = allShifts.find(s => s.id === selectedShiftId);
    if (!shift) return;

    // Calculate differences
    const differences: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 };
    let totalDifference = 0;

    const usedMethods = getUsedMethods();
    usedMethods.forEach(method => {
      const real = parseFloat(realAmounts[method]) || 0;
      const expected = selectedSummary.expectedByMethod[method];
      differences[method] = real - expected;
      totalDifference += differences[method];
    });

    const finalCash = parseFloat(realAmounts.cash) || 0;

    try {
      const newCut = await api.cashCuts.create({
        shift_id: selectedShiftId,
        branch_id: currentBranch.id,
        date: shift.date,
        user_id: shift.userId,
        initial_cash: shift.initialCash,
        final_cash: finalCash,
        expected_cash: selectedSummary.expectedByMethod.cash,
        difference: totalDifference,
        sales_by_method: selectedSummary.salesByMethod,
        total_sales: selectedSummary.totalSales,
        total_expenses: selectedSummary.totalExpenses,
        appointments_count: selectedSummary.completedAppointments,
        direct_sales_count: selectedSummary.directSalesCount,
      });

      setCashCuts(prev => [{
        ...newCut,
        user: shift.user,
        sales_by_method: selectedSummary.salesByMethod,
      }, ...prev]);

      toast.success('Corte de caja generado correctamente');
      setIsDialogOpen(false);
      setSelectedShiftId('');
      setRealAmounts({ cash: '', card: '', transfer: '' });
    } catch (error) {
      console.error('Error creating cash cut:', error);
      toast.error('Error al generar corte');
    }
  };

  const getUsedMethods = (): PaymentMethod[] => {
    if (!selectedSummary) return [];
    const shift = allShifts.find(s => s.id === selectedShiftId);
    return (Object.keys(paymentMethodConfig) as PaymentMethod[]).filter(method => 
      selectedSummary.salesByMethod[method] > 0 || 
      selectedSummary.expensesByMethod[method] > 0 ||
      selectedSummary.purchasesByMethod[method] > 0 ||
      (method === 'cash' && shift?.initialCash)
    );
  };

  const usedMethods = getUsedMethods();

  if (loading || shiftsLoading) {
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
          <h1 className="text-2xl font-bold">Cortes de Caja</h1>
          <p className="text-muted-foreground">Resumen de ventas y cierre de turnos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedShiftId('');
            setRealAmounts({ cash: '', card: '', transfer: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gradient-bg border-0" disabled={pendingShifts.length === 0}>
              <Calculator className="h-4 w-4 mr-2" />
              Nuevo Corte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Generar Corte de Caja</DialogTitle>
              <DialogDescription>
                Selecciona un turno cerrado para generar su corte de caja.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Shift Selection */}
              <div className="space-y-2">
                <Label>Turno a Cortar</Label>
                <select 
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                >
                  <option value="">Selecciona un turno</option>
                  {pendingShifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {new Date(shift.date).toLocaleDateString('es-MX')} - {shift.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {summaryLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {selectedSummary && !summaryLoading && (
                <>
                  {/* Shift Info */}
                  {(() => {
                    const shift = allShifts.find(s => s.id === selectedShiftId);
                    if (!shift) return null;
                    return (
                      <div className="p-4 bg-secondary/30 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{shift.user.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(shift.date).toLocaleDateString('es-MX', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Banknote className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Caja inicial:</span>
                          <span className="font-medium">${shift.initialCash.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="p-3 bg-success/10 rounded-lg text-center">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
                      <p className="text-xs text-muted-foreground">Ventas</p>
                      <p className="font-bold text-success">${selectedSummary.totalSales.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg text-center">
                      <TrendingDown className="h-5 w-5 mx-auto mb-1 text-destructive" />
                      <p className="text-xs text-muted-foreground">Gastos</p>
                      <p className="font-bold text-destructive">${selectedSummary.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-lg text-center">
                      <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-warning" />
                      <p className="text-xs text-muted-foreground">Compras</p>
                      <p className="font-bold text-warning">${selectedSummary.totalPurchases.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg text-center">
                      <Scissors className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Citas</p>
                      <p className="font-bold">{selectedSummary.completedAppointments}</p>
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
                            <TableHead className="text-right font-bold">Esperado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usedMethods.map(method => {
                            const config = paymentMethodConfig[method];
                            const Icon = config.icon;
                            const expected = selectedSummary.expectedByMethod[method];
                            return (
                              <TableRow key={method}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Icon className={cn("h-4 w-4", config.color)} />
                                    <span>{config.label}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-success">
                                  +${selectedSummary.salesByMethod[method].toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-destructive">
                                  -${selectedSummary.expensesByMethod[method].toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right text-warning">
                                  -${selectedSummary.purchasesByMethod[method].toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  ${expected.toLocaleString()}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Real Amount Inputs */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Ingresa los Montos Reales Recibidos
                    </h4>
                    
                    <div className="grid gap-3">
                      {usedMethods.map(method => {
                        const config = paymentMethodConfig[method];
                        const Icon = config.icon;
                        const expected = selectedSummary.expectedByMethod[method];
                        const real = parseFloat(realAmounts[method]) || 0;
                        const diff = real - expected;
                        const hasValue = realAmounts[method] !== '';
                        
                        return (
                          <div key={method} className={cn("p-3 rounded-lg border", config.bg)}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-5 w-5", config.color)} />
                                <span className="font-medium">{config.label}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                Esperado: ${expected.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="relative flex-1">
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
                              {hasValue && (
                                <Badge className={cn(
                                  "min-w-[80px] justify-center",
                                  diff === 0
                                    ? "bg-success/20 text-success border-success/30"
                                    : diff > 0
                                      ? "bg-info/20 text-info border-info/30"
                                      : "bg-destructive/20 text-destructive border-destructive/30"
                                )}>
                                  {diff >= 0 ? '+' : ''}{diff.toLocaleString()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total Difference */}
                  {usedMethods.some(m => realAmounts[m] !== '') && (
                    <div className={cn(
                      "p-4 rounded-lg border-2",
                      (() => {
                        const totalDiff = usedMethods.reduce((sum, m) => {
                          const real = parseFloat(realAmounts[m]) || 0;
                          const expected = selectedSummary.expectedByMethod[m];
                          return sum + (real - expected);
                        }, 0);
                        return totalDiff === 0
                          ? "bg-success/10 border-success/30"
                          : totalDiff > 0
                            ? "bg-info/10 border-info/30"
                            : "bg-destructive/10 border-destructive/30";
                      })()
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const totalDiff = usedMethods.reduce((sum, m) => {
                              const real = parseFloat(realAmounts[m]) || 0;
                              const expected = selectedSummary.expectedByMethod[m];
                              return sum + (real - expected);
                            }, 0);
                            return totalDiff === 0 
                              ? <CheckCircle className="h-5 w-5 text-success" />
                              : <AlertTriangle className="h-5 w-5 text-warning" />;
                          })()}
                          <span className="font-medium">Diferencia Total:</span>
                        </div>
                        <span className={cn(
                          "text-xl font-bold",
                          (() => {
                            const totalDiff = usedMethods.reduce((sum, m) => {
                              const real = parseFloat(realAmounts[m]) || 0;
                              const expected = selectedSummary.expectedByMethod[m];
                              return sum + (real - expected);
                            }, 0);
                            return totalDiff === 0
                              ? "text-success"
                              : totalDiff > 0
                                ? "text-info"
                                : "text-destructive";
                          })()
                        )}>
                          {(() => {
                            const totalDiff = usedMethods.reduce((sum, m) => {
                              const real = parseFloat(realAmounts[m]) || 0;
                              const expected = selectedSummary.expectedByMethod[m];
                              return sum + (real - expected);
                            }, 0);
                            return `${totalDiff >= 0 ? '+' : ''}$${totalDiff.toLocaleString()}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedShiftId('');
                  setRealAmounts({ cash: '', card: '', transfer: '' });
                }}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-bg border-0"
                  onClick={handleSubmit}
                  disabled={!selectedShiftId || usedMethods.every(m => realAmounts[m] === '')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Corte
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending Shifts Alert */}
      {pendingShifts.length > 0 && (
        <div className="glass-card rounded-xl p-4 border-2 border-warning/30 bg-warning/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium">Turnos pendientes de corte</p>
              <p className="text-sm text-muted-foreground">
                Hay {pendingShifts.length} turno(s) cerrado(s) sin corte de caja
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Table / Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {cashCuts.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
              No hay cortes de caja registrados
            </div>
          ) : (
            cashCuts
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((cut) => (
                <div key={cut.id} className="glass-card rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: cut.user?.color || '#3B82F6' }}
                        />
                        <p className="font-semibold">{cut.user?.name || 'Usuario'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(cut.date).toLocaleDateString('es-MX')}
                      </div>
                    </div>
                    <Badge className={cn(
                      "border",
                      cut.difference === 0
                        ? "bg-success/20 text-success border-success/30"
                        : cut.difference > 0
                          ? "bg-info/20 text-info border-info/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                    )}>
                      {cut.difference >= 0 ? '+' : ''}${cut.difference.toLocaleString()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ventas</p>
                      <p className="font-semibold text-success">${cut.total_sales.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gastos</p>
                      <p className="font-semibold text-destructive">${cut.total_expenses.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Esperado</p>
                      <p className="font-semibold">${cut.expected_cash.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Real</p>
                      <p className="font-semibold">${cut.final_cash.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setViewingCut(cut)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver detalle
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead className="text-right">Ventas</TableHead>
                <TableHead className="text-right">Gastos</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashCuts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay cortes de caja registrados
                  </TableCell>
                </TableRow>
              ) : (
                cashCuts
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((cut) => (
                    <TableRow key={cut.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(cut.date).toLocaleDateString('es-MX')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 w-3 rounded-full" 
                            style={{ backgroundColor: cut.user?.color || '#3B82F6' }}
                          />
                          {cut.user?.name || 'Usuario'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        ${cut.total_sales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        ${cut.total_expenses.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${cut.expected_cash.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${cut.final_cash.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className={cn(
                          "border",
                          cut.difference === 0
                            ? "bg-success/20 text-success border-success/30"
                            : cut.difference > 0
                              ? "bg-info/20 text-info border-info/30"
                              : "bg-destructive/20 text-destructive border-destructive/30"
                        )}>
                          {cut.difference >= 0 ? '+' : ''}${cut.difference.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => setViewingCut(cut)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewingCut} onOpenChange={() => setViewingCut(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle del Corte</DialogTitle>
          </DialogHeader>
          {viewingCut && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{new Date(viewingCut.date).toLocaleDateString('es-MX')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Responsable:</span>
                  <span>{viewingCut.user?.name || 'Usuario'}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Desglose de Ventas</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <Banknote className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-xs text-muted-foreground">Efectivo</p>
                    <p className="font-bold">${(viewingCut.sales_by_method?.cash || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                    <CreditCard className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-xs text-muted-foreground">Tarjeta</p>
                    <p className="font-bold">${(viewingCut.sales_by_method?.card || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg text-center">
                    <ArrowRightLeft className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-xs text-muted-foreground">Transferencia</p>
                    <p className="font-bold">${(viewingCut.sales_by_method?.transfer || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h4 className="font-medium">Resumen</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                    <span>{viewingCut.appointments_count} citas completadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span>{viewingCut.direct_sales_count} ventas directas</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efectivo inicial:</span>
                  <span>${viewingCut.initial_cash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Total ventas:</span>
                  <span>+${viewingCut.total_sales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Total gastos:</span>
                  <span>-${viewingCut.total_expenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Efectivo esperado:</span>
                  <span>${viewingCut.expected_cash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Efectivo real:</span>
                  <span>${viewingCut.final_cash.toLocaleString()}</span>
                </div>
              </div>

              <div className={cn(
                "p-3 rounded-lg flex items-center justify-between",
                viewingCut.difference === 0
                  ? "bg-success/10"
                  : viewingCut.difference > 0
                    ? "bg-info/10"
                    : "bg-destructive/10"
              )}>
                <span className="font-medium">Diferencia:</span>
                <span className={cn(
                  "text-lg font-bold",
                  viewingCut.difference === 0
                    ? "text-success"
                    : viewingCut.difference > 0
                      ? "text-info"
                      : "text-destructive"
                )}>
                  {viewingCut.difference >= 0 ? '+' : ''}${viewingCut.difference.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
