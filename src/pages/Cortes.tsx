import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  cashCuts as mockCashCuts,
  sales,
  expenses,
  purchases,
  appointments,
  type CashCut,
} from '@/lib/mockData';
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
  Package,
} from 'lucide-react';
import { toast } from 'sonner';

const paymentMethodConfig = {
  cash: { label: 'Efectivo', icon: Banknote, color: 'text-green-600', bg: 'bg-green-500/10' },
  card: { label: 'Tarjeta', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  transfer: { label: 'Transferencia', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-500/10' },
};

type PaymentMethod = keyof typeof paymentMethodConfig;

interface ShiftSummary {
  shift: ReturnType<typeof useShift>['openShift'];
  // Sales breakdown
  salesByMethod: Record<PaymentMethod, number>;
  totalSales: number;
  appointmentSalesCount: number;
  directSalesCount: number;
  // Expenses breakdown
  expensesByMethod: Record<PaymentMethod, number>;
  totalExpenses: number;
  // Purchases breakdown
  purchasesByMethod: Record<PaymentMethod, number>;
  totalPurchases: number;
  // Expected by method
  expectedByMethod: Record<PaymentMethod, number>;
  // Appointments completed count
  completedAppointments: number;
}

export default function Cortes() {
  const { currentBranch } = useApp();
  const { shifts, getShiftsForBranch } = useShift(currentBranch.id);
  const isMobile = useIsMobile();
  const [cashCuts, setCashCuts] = useState<CashCut[]>(mockCashCuts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingCut, setViewingCut] = useState<CashCut | null>(null);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [realAmounts, setRealAmounts] = useState<Record<PaymentMethod, string>>({
    cash: '',
    card: '',
    transfer: '',
  });

  const filteredCuts = cashCuts.filter(c => c.branchId === currentBranch.id);
  const allShifts = getShiftsForBranch(currentBranch.id);
  const closedShifts = allShifts.filter(s => s.status === 'closed');
  const cutShiftIds = new Set(cashCuts.map(c => c.shiftId));
  const pendingShifts = closedShifts.filter(s => !cutShiftIds.has(s.id));

  const calculateShiftSummary = (shiftId: string): ShiftSummary | null => {
    const shift = allShifts.find(s => s.id === shiftId);
    if (!shift) return null;

    const shiftDate = shift.date;
    
    // Filter data for this shift's date and branch
    const shiftSales = sales.filter(s => 
      s.branchId === currentBranch.id && s.date === shiftDate
    );
    const shiftExpenses = expenses.filter(e => 
      e.branchId === currentBranch.id && e.date === shiftDate
    );
    const shiftPurchases = purchases.filter(p => 
      p.branchId === currentBranch.id && p.date === shiftDate
    );
    const shiftAppointments = appointments.filter(a => 
      a.branchId === currentBranch.id && 
      a.date === shiftDate && 
      a.status === 'completed'
    );

    // Initialize method totals
    const salesByMethod: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 };
    const expensesByMethod: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 };
    const purchasesByMethod: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 };

    // Calculate sales by method (including mixed payments)
    shiftSales.forEach(sale => {
      if (sale.paymentMethod === 'mixed' && sale.payments) {
        sale.payments.forEach(p => {
          if (p.method in salesByMethod) {
            salesByMethod[p.method as PaymentMethod] += p.amount;
          }
        });
      } else if (sale.paymentMethod in salesByMethod) {
        salesByMethod[sale.paymentMethod as PaymentMethod] += sale.total;
      }
    });

    // Calculate expenses by method
    shiftExpenses.forEach(expense => {
      if (expense.paymentMethod in expensesByMethod) {
        expensesByMethod[expense.paymentMethod as PaymentMethod] += expense.amount;
      }
    });

    // Calculate purchases by method
    shiftPurchases.forEach(purchase => {
      if (purchase.paymentMethod in purchasesByMethod) {
        purchasesByMethod[purchase.paymentMethod as PaymentMethod] += purchase.total;
      }
    });

    // Calculate expected amounts per method
    const expectedByMethod: Record<PaymentMethod, number> = {
      cash: shift.initialCash + salesByMethod.cash - expensesByMethod.cash - purchasesByMethod.cash,
      card: salesByMethod.card - expensesByMethod.card - purchasesByMethod.card,
      transfer: salesByMethod.transfer - expensesByMethod.transfer - purchasesByMethod.transfer,
    };

    const totalSales = Object.values(salesByMethod).reduce((sum, v) => sum + v, 0);
    const totalExpenses = Object.values(expensesByMethod).reduce((sum, v) => sum + v, 0);
    const totalPurchases = Object.values(purchasesByMethod).reduce((sum, v) => sum + v, 0);

    return {
      shift,
      salesByMethod,
      totalSales,
      appointmentSalesCount: shiftSales.filter(s => s.type === 'appointment').length,
      directSalesCount: shiftSales.filter(s => s.type === 'direct').length,
      expensesByMethod,
      totalExpenses,
      purchasesByMethod,
      totalPurchases,
      expectedByMethod,
      completedAppointments: shiftAppointments.length,
    };
  };

  const selectedSummary = selectedShiftId ? calculateShiftSummary(selectedShiftId) : null;

  // Reset real amounts when shift changes
  useEffect(() => {
    if (selectedSummary) {
      setRealAmounts({
        cash: '',
        card: '',
        transfer: '',
      });
    }
  }, [selectedShiftId]);

  const handleSubmit = () => {
    if (!selectedSummary || !selectedSummary.shift) {
      toast.error('Selecciona un turno');
      return;
    }

    // Calculate differences
    const differences: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 };
    let totalDifference = 0;

    (Object.keys(paymentMethodConfig) as PaymentMethod[]).forEach(method => {
      const real = parseFloat(realAmounts[method]) || 0;
      const expected = selectedSummary.expectedByMethod[method];
      differences[method] = real - expected;
      totalDifference += differences[method];
    });

    const finalCash = parseFloat(realAmounts.cash) || 0;
    const expectedCash = selectedSummary.expectedByMethod.cash;

    const newCut: CashCut = {
      id: `cc${Date.now()}`,
      shiftId: selectedShiftId,
      branchId: currentBranch.id,
      date: selectedSummary.shift.date,
      userId: selectedSummary.shift.userId,
      user: selectedSummary.shift.user,
      initialCash: selectedSummary.shift.initialCash,
      finalCash,
      expectedCash,
      difference: totalDifference,
      salesByMethod: selectedSummary.salesByMethod,
      totalSales: selectedSummary.totalSales,
      totalExpenses: selectedSummary.totalExpenses,
      appointmentsCount: selectedSummary.completedAppointments,
      directSalesCount: selectedSummary.directSalesCount,
    };

    setCashCuts(prev => [newCut, ...prev]);
    toast.success('Corte de caja generado correctamente');
    setIsDialogOpen(false);
    setSelectedShiftId('');
    setRealAmounts({ cash: '', card: '', transfer: '' });
  };

  const getUsedMethods = (): PaymentMethod[] => {
    if (!selectedSummary) return [];
    return (Object.keys(paymentMethodConfig) as PaymentMethod[]).filter(method => 
      selectedSummary.salesByMethod[method] > 0 || 
      selectedSummary.expensesByMethod[method] > 0 ||
      selectedSummary.purchasesByMethod[method] > 0 ||
      (method === 'cash' && selectedSummary.shift?.initialCash)
    );
  };

  const usedMethods = getUsedMethods();

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

              {selectedSummary && selectedSummary.shift && (
                <>
                  {/* Shift Info */}
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{selectedSummary.shift.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedSummary.shift.date).toLocaleDateString('es-MX', { 
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
                      <span className="font-medium">${selectedSummary.shift.initialCash.toLocaleString()}</span>
                    </div>
                  </div>

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
          {filteredCuts.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
              No hay cortes de caja registrados
            </div>
          ) : (
            filteredCuts
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((cut) => (
                <div key={cut.id} className="glass-card rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: cut.user.color }}
                        />
                        <p className="font-semibold">{cut.user.name}</p>
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
                      <p className="font-semibold text-success">${cut.totalSales.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Gastos</p>
                      <p className="font-semibold text-destructive">${cut.totalExpenses.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Esperado</p>
                      <p className="font-semibold">${cut.expectedCash.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Real</p>
                      <p className="font-semibold">${cut.finalCash.toLocaleString()}</p>
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
              {filteredCuts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay cortes de caja registrados
                  </TableCell>
                </TableRow>
              ) : (
                filteredCuts
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
                            style={{ backgroundColor: cut.user.color }}
                          />
                          {cut.user.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        ${cut.totalSales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        ${cut.totalExpenses.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${cut.expectedCash.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${cut.finalCash.toLocaleString()}
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
                  <span>{viewingCut.user.name}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Desglose de Ventas</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <Banknote className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-xs text-muted-foreground">Efectivo</p>
                    <p className="font-bold">${viewingCut.salesByMethod.cash.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                    <CreditCard className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-xs text-muted-foreground">Tarjeta</p>
                    <p className="font-bold">${viewingCut.salesByMethod.card.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-500/10 rounded-lg text-center">
                    <ArrowRightLeft className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-xs text-muted-foreground">Transferencia</p>
                    <p className="font-bold">${viewingCut.salesByMethod.transfer.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h4 className="font-medium">Resumen</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                    <span>{viewingCut.appointmentsCount} citas completadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span>{viewingCut.directSalesCount} ventas directas</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Efectivo inicial:</span>
                  <span>${viewingCut.initialCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>Total ventas:</span>
                  <span>+${viewingCut.totalSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Total gastos:</span>
                  <span>-${viewingCut.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Efectivo esperado:</span>
                  <span>${viewingCut.expectedCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Efectivo real:</span>
                  <span>${viewingCut.finalCash.toLocaleString()}</span>
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
