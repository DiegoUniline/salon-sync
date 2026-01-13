import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  cashCuts as mockCashCuts,
  shifts,
  sales,
  expenses,
  stylists,
  type CashCut,
} from '@/lib/mockData';
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
  AlertTriangle,
  CheckCircle,
  Eye,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

export default function Cortes() {
  const { currentBranch } = useApp();
  const [cashCuts, setCashCuts] = useState<CashCut[]>(mockCashCuts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingCut, setViewingCut] = useState<CashCut | null>(null);

  const [formData, setFormData] = useState({
    shiftId: '',
    finalCash: '',
  });

  const filteredCuts = cashCuts.filter(c => c.branchId === currentBranch.id);
  const closedShifts = shifts.filter(s => s.branchId === currentBranch.id && s.status === 'closed');
  const cutShiftIds = new Set(cashCuts.map(c => c.shiftId));
  const pendingShifts = closedShifts.filter(s => !cutShiftIds.has(s.id));

  const today = new Date().toISOString().split('T')[0];

  const calculateShiftData = (shiftId: string) => {
    const shift = shifts.find(s => s.id === shiftId);
    if (!shift) return null;

    const shiftDate = shift.date;
    const shiftSales = sales.filter(s => 
      s.branchId === currentBranch.id && s.date === shiftDate
    );
    const shiftExpenses = expenses.filter(e => 
      e.branchId === currentBranch.id && e.date === shiftDate
    );

    const cashSales = shiftSales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
    const cardSales = shiftSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);
    const transferSales = shiftSales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.total, 0);
    
    // For mixed payments, aggregate by method
    shiftSales.filter(s => s.paymentMethod === 'mixed').forEach(s => {
      s.payments?.forEach(p => {
        if (p.method === 'cash') cashSales;
        // Note: In real app, would properly aggregate mixed payments
      });
    });

    const totalSales = shiftSales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = shiftExpenses.filter(e => e.paymentMethod === 'cash').reduce((sum, e) => sum + e.amount, 0);
    
    const expectedCash = shift.initialCash + cashSales - totalExpenses;
    
    const appointmentSales = shiftSales.filter(s => s.type === 'appointment').length;
    const directSales = shiftSales.filter(s => s.type === 'direct').length;

    return {
      shift,
      salesByMethod: { cash: cashSales, card: cardSales, transfer: transferSales },
      totalSales,
      totalExpenses,
      expectedCash,
      appointmentsCount: appointmentSales,
      directSalesCount: directSales,
    };
  };

  const handleSubmit = () => {
    const data = calculateShiftData(formData.shiftId);
    if (!data || !formData.finalCash) {
      toast.error('Completa los datos requeridos');
      return;
    }

    const finalCash = parseFloat(formData.finalCash);
    const difference = finalCash - data.expectedCash;

    const newCut: CashCut = {
      id: `cc${Date.now()}`,
      shiftId: formData.shiftId,
      branchId: currentBranch.id,
      date: data.shift.date,
      userId: data.shift.userId,
      user: data.shift.user,
      initialCash: data.shift.initialCash,
      finalCash,
      expectedCash: data.expectedCash,
      difference,
      salesByMethod: data.salesByMethod,
      totalSales: data.totalSales,
      totalExpenses: data.totalExpenses,
      appointmentsCount: data.appointmentsCount,
      directSalesCount: data.directSalesCount,
    };

    setCashCuts(prev => [newCut, ...prev]);
    toast.success('Corte de caja generado correctamente');
    setIsDialogOpen(false);
    setFormData({ shiftId: '', finalCash: '' });
  };

  const selectedShiftData = formData.shiftId ? calculateShiftData(formData.shiftId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cortes de Caja</h1>
          <p className="text-muted-foreground">Resumen de ventas y cierre de turnos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg border-0" disabled={pendingShifts.length === 0}>
              <Calculator className="h-4 w-4 mr-2" />
              Nuevo Corte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Generar Corte de Caja</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Turno a Cortar</Label>
                <select 
                  className="w-full h-10 px-3 rounded-md border bg-background"
                  value={formData.shiftId}
                  onChange={(e) => setFormData(prev => ({ ...prev, shiftId: e.target.value }))}
                >
                  <option value="">Selecciona un turno</option>
                  {pendingShifts.map(shift => (
                    <option key={shift.id} value={shift.id}>
                      {new Date(shift.date).toLocaleDateString('es-MX')} - {shift.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedShiftData && (
                <>
                  <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
                    <h4 className="font-medium">Resumen del Turno</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Efectivo inicial:</span>
                        <span>${selectedShiftData.shift.initialCash.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Responsable:</span>
                        <span>{selectedShiftData.shift.user.name}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      <p className="font-medium text-sm">Ventas por Método:</p>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4 text-green-600" />
                          <span>${selectedShiftData.salesByMethod.cash.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span>${selectedShiftData.salesByMethod.card.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft className="h-4 w-4 text-purple-600" />
                          <span>${selectedShiftData.salesByMethod.transfer.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total ventas:</span>
                        <span className="text-success font-medium">+${selectedShiftData.totalSales.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gastos efectivo:</span>
                        <span className="text-destructive font-medium">-${selectedShiftData.totalExpenses.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Efectivo Esperado:</span>
                        <span className="text-lg font-bold">${selectedShiftData.expectedCash.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Efectivo Real Contado</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        value={formData.finalCash}
                        onChange={(e) => setFormData(prev => ({ ...prev, finalCash: e.target.value }))}
                        className="pl-7"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {formData.finalCash && (
                    <div className={cn(
                      "p-3 rounded-lg",
                      parseFloat(formData.finalCash) === selectedShiftData.expectedCash
                        ? "bg-success/10 border border-success/30"
                        : parseFloat(formData.finalCash) > selectedShiftData.expectedCash
                          ? "bg-info/10 border border-info/30"
                          : "bg-destructive/10 border border-destructive/30"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Diferencia:</span>
                        <span className={cn(
                          "text-lg font-bold",
                          parseFloat(formData.finalCash) === selectedShiftData.expectedCash
                            ? "text-success"
                            : parseFloat(formData.finalCash) > selectedShiftData.expectedCash
                              ? "text-info"
                              : "text-destructive"
                        )}>
                          {parseFloat(formData.finalCash) >= selectedShiftData.expectedCash ? '+' : ''}
                          ${(parseFloat(formData.finalCash) - selectedShiftData.expectedCash).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-bg border-0"
                  onClick={handleSubmit}
                  disabled={!formData.shiftId || !formData.finalCash}
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

      {/* Table */}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Citas</span>
                  </div>
                  <p className="text-xl font-bold">{viewingCut.appointmentsCount}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Ventas Directas</span>
                  </div>
                  <p className="text-xl font-bold">{viewingCut.directSalesCount}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Efectivo inicial:</span>
                  <span>${viewingCut.initialCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-success">
                  <span>+ Ventas efectivo:</span>
                  <span>${viewingCut.salesByMethod.cash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>- Gastos efectivo:</span>
                  <span>${viewingCut.totalExpenses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>= Esperado:</span>
                  <span>${viewingCut.expectedCash.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Contado:</span>
                  <span>${viewingCut.finalCash.toLocaleString()}</span>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-lg flex items-center justify-between",
                viewingCut.difference === 0
                  ? "bg-success/10"
                  : viewingCut.difference > 0
                    ? "bg-info/10"
                    : "bg-destructive/10"
              )}>
                <div className="flex items-center gap-2">
                  {viewingCut.difference === 0 ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : viewingCut.difference > 0 ? (
                    <TrendingUp className="h-5 w-5 text-info" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  <span className="font-medium">Diferencia:</span>
                </div>
                <span className={cn(
                  "text-xl font-bold",
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
