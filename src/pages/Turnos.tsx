import { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  stylists,
  sales,
  expenses,
  purchases,
  appointments,
  cashCuts as mockCashCuts,
  type CashCut,
} from '@/lib/mockData';
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
} from 'lucide-react';
import { toast } from 'sonner';

const paymentMethodConfig = {
  cash: { label: 'Efectivo', icon: Banknote, color: 'text-green-600', bg: 'bg-green-500/10' },
  card: { label: 'Tarjeta', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-500/10' },
  transfer: { label: 'Transferencia', icon: ArrowRightLeft, color: 'text-purple-600', bg: 'bg-purple-500/10' },
};

type PaymentMethod = keyof typeof paymentMethodConfig;

export default function Turnos() {
  const { currentBranch } = useApp();
  const { shifts, openShift, hasOpenShift, openTurn, closeTurn, getShiftsForBranch } = useShift(currentBranch.id);
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [cashCuts, setCashCuts] = useState<CashCut[]>(mockCashCuts);

  const [openFormData, setOpenFormData] = useState({
    userId: '',
    initialCash: '',
  });

  const [realAmounts, setRealAmounts] = useState<Record<PaymentMethod, string>>({
    cash: '',
    card: '',
    transfer: '',
  });

  const filteredShifts = getShiftsForBranch(currentBranch.id);

  // Calculate shift summary for closing
  const shiftSummary = useMemo(() => {
    if (!openShift) return null;

    const shiftDate = openShift.date;
    
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
      cash: openShift.initialCash + salesByMethod.cash - expensesByMethod.cash - purchasesByMethod.cash,
      card: salesByMethod.card - expensesByMethod.card - purchasesByMethod.card,
      transfer: salesByMethod.transfer - expensesByMethod.transfer - purchasesByMethod.transfer,
    };

    const totalSales = Object.values(salesByMethod).reduce((sum, v) => sum + v, 0);
    const totalExpenses = Object.values(expensesByMethod).reduce((sum, v) => sum + v, 0);
    const totalPurchases = Object.values(purchasesByMethod).reduce((sum, v) => sum + v, 0);

    // Get methods that were actually used
    const usedMethods = (Object.keys(paymentMethodConfig) as PaymentMethod[]).filter(method => 
      salesByMethod[method] > 0 || 
      expensesByMethod[method] > 0 ||
      purchasesByMethod[method] > 0 ||
      (method === 'cash') // Always include cash
    );

    return {
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
      usedMethods,
    };
  }, [openShift, currentBranch.id]);

  const handleOpenTurn = () => {
    if (!openFormData.userId || !openFormData.initialCash) {
      toast.error('Completa los campos requeridos');
      return;
    }

    const result = openTurn(
      openFormData.userId,
      parseFloat(openFormData.initialCash),
      currentBranch.id
    );

    if (result) {
      toast.success('Turno abierto correctamente');
      setIsOpenDialogOpen(false);
      setOpenFormData({ userId: '', initialCash: '' });
    } else {
      toast.error('No se pudo abrir el turno');
    }
  };

  const handleCloseTurn = () => {
    if (!openShift || !shiftSummary) {
      toast.error('No hay turno activo');
      return;
    }

    // Check at least cash amount is entered
    if (!realAmounts.cash) {
      toast.error('Ingresa al menos el efectivo en caja');
      return;
    }

    // Calculate total difference
    let totalDifference = 0;
    const differences: Record<PaymentMethod, number> = { cash: 0, card: 0, transfer: 0 };
    
    shiftSummary.usedMethods.forEach(method => {
      const real = parseFloat(realAmounts[method]) || 0;
      const expected = shiftSummary.expectedByMethod[method];
      differences[method] = real - expected;
      totalDifference += differences[method];
    });

    const finalCash = parseFloat(realAmounts.cash) || 0;

    // Create cash cut
    const newCut: CashCut = {
      id: `cc${Date.now()}`,
      shiftId: openShift.id,
      branchId: currentBranch.id,
      date: openShift.date,
      userId: openShift.userId,
      user: openShift.user,
      initialCash: openShift.initialCash,
      finalCash,
      expectedCash: shiftSummary.expectedByMethod.cash,
      difference: totalDifference,
      salesByMethod: shiftSummary.salesByMethod,
      totalSales: shiftSummary.totalSales,
      totalExpenses: shiftSummary.totalExpenses,
      appointmentsCount: shiftSummary.completedAppointments,
      directSalesCount: shiftSummary.directSalesCount,
    };

    setCashCuts(prev => [newCut, ...prev]);

    // Close the shift
    const success = closeTurn(openShift.id, finalCash);

    if (success) {
      toast.success('Turno cerrado y corte generado correctamente');
      setIsCloseDialogOpen(false);
      setRealAmounts({ cash: '', card: '', transfer: '' });
    } else {
      toast.error('No se pudo cerrar el turno');
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Calculate total difference for display
  const totalDifference = useMemo(() => {
    if (!shiftSummary) return 0;
    return shiftSummary.usedMethods.reduce((sum, method) => {
      const real = parseFloat(realAmounts[method]) || 0;
      const expected = shiftSummary.expectedByMethod[method];
      return sum + (real - expected);
    }, 0);
  }, [shiftSummary, realAmounts]);

  const hasAnyAmount = shiftSummary?.usedMethods.some(m => realAmounts[m] !== '');

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
                        {stylists.map(stylist => (
                          <SelectItem key={stylist.id} value={stylist.id}>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stylist.color }} />
                              {stylist.name}
                            </div>
                          </SelectItem>
                        ))}
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
              <p className="font-semibold">{new Date(openShift.date).toLocaleDateString('es-MX')}</p>
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
        <Table>
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
                        {new Date(shift.date).toLocaleDateString('es-MX')}
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

      {/* Close Turn Dialog - COMPLETE with breakdown */}
      <Dialog open={isCloseDialogOpen} onOpenChange={(open) => {
        setIsCloseDialogOpen(open);
        if (!open) setRealAmounts({ cash: '', card: '', transfer: '' });
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Cerrar Turno y Corte de Caja
            </DialogTitle>
          </DialogHeader>
          
          {openShift && shiftSummary && (
            <div className="space-y-4 py-4">
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

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-success/10 rounded-lg text-center">
                  <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
                  <p className="text-xs text-muted-foreground">Ventas</p>
                  <p className="font-bold text-success">${shiftSummary.totalSales.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-destructive/10 rounded-lg text-center">
                  <TrendingDown className="h-5 w-5 mx-auto mb-1 text-destructive" />
                  <p className="text-xs text-muted-foreground">Gastos</p>
                  <p className="font-bold text-destructive">${shiftSummary.totalExpenses.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-warning/10 rounded-lg text-center">
                  <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <p className="text-xs text-muted-foreground">Compras</p>
                  <p className="font-bold text-warning">${shiftSummary.totalPurchases.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <Scissors className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Citas</p>
                  <p className="font-bold">{shiftSummary.completedAppointments}</p>
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
                      {shiftSummary.usedMethods.map(method => {
                        const config = paymentMethodConfig[method];
                        const Icon = config.icon;
                        const expected = shiftSummary.expectedByMethod[method];
                        return (
                          <TableRow key={method}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", config.color)} />
                                <span>{config.label}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-success">
                              +${shiftSummary.salesByMethod[method].toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-destructive">
                              -${shiftSummary.expensesByMethod[method].toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right text-warning">
                              -${shiftSummary.purchasesByMethod[method].toLocaleString()}
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
                  {shiftSummary.usedMethods.map(method => {
                    const config = paymentMethodConfig[method];
                    const Icon = config.icon;
                    const expected = shiftSummary.expectedByMethod[method];
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
              {hasAnyAmount && (
                <div className={cn(
                  "p-4 rounded-lg border-2",
                  totalDifference === 0
                    ? "bg-success/10 border-success/30"
                    : totalDifference > 0
                      ? "bg-info/10 border-info/30"
                      : "bg-destructive/10 border-destructive/30"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {totalDifference === 0 
                        ? <CheckCircle className="h-5 w-5 text-success" />
                        : <AlertTriangle className="h-5 w-5 text-warning" />
                      }
                      <span className="font-medium">Diferencia Total:</span>
                    </div>
                    <span className={cn(
                      "text-xl font-bold",
                      totalDifference === 0
                        ? "text-success"
                        : totalDifference > 0
                          ? "text-info"
                          : "text-destructive"
                    )}>
                      {totalDifference >= 0 ? '+' : ''}${totalDifference.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsCloseDialogOpen(false);
                  setRealAmounts({ cash: '', card: '', transfer: '' });
                }}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleCloseTurn}
                  disabled={!realAmounts.cash}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Cerrar Turno y Generar Corte
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
