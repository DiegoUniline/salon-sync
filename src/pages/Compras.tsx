import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { 
  purchases as mockPurchases,
  products,
  type Purchase,
} from '@/lib/mockData';
import { ShiftRequiredAlert } from '@/components/ShiftRequiredAlert';
import { useShift } from '@/hooks/useShift';
import { useIsMobile } from '@/hooks/use-mobile';
import { AnimatedContainer, AnimatedCard, AnimatedList, AnimatedListItem, PageTransition } from '@/components/ui/animated-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { OdooLineEditor, type LineItem, type ColumnConfig } from '@/components/OdooLineEditor';
import { MultiPaymentSelector, type Payment } from '@/components/MultiPaymentSelector';
import {
  Plus,
  Search,
  Package,
  Truck,
  Calendar,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Trash2,
  Eye,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRightLeft,
};

const paymentLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

export default function Compras() {
  const { currentBranch } = useApp();
  const { canCreate, canDelete } = usePermissions();
  const { hasOpenShift } = useShift(currentBranch.id);
  const isMobile = useIsMobile();
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  // Form state
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([
    { id: 'pay-1', method: 'transfer', amount: 0 }
  ]);

  // Require open shift for purchases
  if (!hasOpenShift) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Compras</h1>
          <p className="text-muted-foreground">Registro de compras a proveedores</p>
        </div>
        <ShiftRequiredAlert action="registrar compras" />
      </div>
    );
  }

  const filteredPurchases = purchases.filter(p => {
    const matchesBranch = p.branchId === currentBranch.id;
    const matchesSearch = p.supplier.toLowerCase().includes(search.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const totalCompras = filteredPurchases.reduce((sum, p) => sum + p.total, 0);

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + ((line.quantity || 0) * (line.unitCost || 0)), 0);
  };

  const resetForm = () => {
    setSupplier('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setLines([]);
    setPayments([{ id: 'pay-1', method: 'transfer', amount: 0 }]);
  };

  // Line columns config
  const lineColumns: ColumnConfig[] = [
    {
      key: 'productName',
      label: 'Producto',
      type: 'search',
      placeholder: 'Buscar producto...',
      width: 'flex-[2]',
      searchItems: products.map(p => ({
        id: p.id,
        label: p.name,
        subLabel: `SKU: ${p.sku} | Stock: ${p.stock}`,
        data: p,
      })),
      onSelect: (item, lineId) => {
        setLines(prev => prev.map(line =>
          line.id === lineId 
            ? { ...line, productId: item.id, productName: item.label, unitCost: item.data.cost }
            : line
        ));
      },
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      type: 'number',
      width: 'w-24',
      min: 1,
    },
    {
      key: 'unitCost',
      label: 'Costo Unit.',
      type: 'number',
      width: 'w-28',
      min: 0,
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      type: 'number',
      width: 'w-28',
      readOnly: true,
      format: (value) => `$${(value || 0).toLocaleString()}`,
    },
  ];

  const addLine = () => {
    setLines(prev => [
      ...prev,
      { id: `line-${Date.now()}`, productId: '', productName: '', quantity: 1, unitCost: 0, subtotal: 0 }
    ]);
  };

  const updateLine = (lineId: string, key: string, value: any) => {
    setLines(prev => prev.map(line => {
      if (line.id !== lineId) return line;
      const updated = { ...line, [key]: value };
      updated.subtotal = (updated.quantity || 0) * (updated.unitCost || 0);
      return updated;
    }));
  };

  const removeLine = (lineId: string) => {
    setLines(prev => prev.filter(line => line.id !== lineId));
  };

  const handleSubmit = () => {
    if (!supplier) {
      toast.error('Ingresa el proveedor');
      return;
    }
    if (lines.filter(l => l.productId).length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    const total = calculateTotal();
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid < total) {
      toast.error('El monto pagado es menor al total');
      return;
    }

    const newPurchase: Purchase = {
      id: `pu${Date.now()}`,
      branchId: currentBranch.id,
      date,
      supplier,
      items: lines.filter(l => l.productId).map(line => ({
        product: products.find(p => p.id === line.productId)!,
        quantity: line.quantity,
        unitCost: line.unitCost,
      })),
      total,
      paymentMethod: payments.length > 1 ? 'transfer' : payments[0].method,
      notes,
    };

    setPurchases(prev => [newPurchase, ...prev]);
    toast.success('Compra registrada correctamente');
    setIsDialogOpen(false);
    resetForm();
  };

  const deletePurchase = (id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
    toast.success('Compra eliminada');
  };

  // Update payments when total changes
  const total = calculateTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Compras</h1>
          <p className="text-muted-foreground">Registro de compras a proveedores</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-bg border-0" disabled={!canCreate('compras')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Compra</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Header info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Nombre del proveedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Products - Odoo style */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Productos</Label>
                <p className="text-sm text-muted-foreground">
                  Usa Tab para moverte entre campos. Al final de la última línea, Tab agrega una nueva.
                </p>
                <OdooLineEditor
                  lines={lines}
                  columns={lineColumns}
                  onUpdateLine={updateLine}
                  onRemoveLine={removeLine}
                  onAddLine={addLine}
                  showTotal
                  totalLabel="Total de la Compra"
                  totalValue={total}
                  emptyMessage="Haz clic o presiona Tab para agregar productos"
                />
              </div>

              {/* Payments */}
              <MultiPaymentSelector
                payments={payments}
                onChange={setPayments}
                total={total}
              />

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-bg border-0"
                  onClick={handleSubmit}
                  disabled={!supplier || lines.filter(l => l.productId).length === 0}
                >
                  Registrar Compra
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Compras</p>
              <p className="text-2xl font-bold">{filteredPurchases.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <Package className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monto Total</p>
              <p className="text-2xl font-bold">${totalCompras.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-info/10">
              <Truck className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Proveedores</p>
              <p className="text-2xl font-bold">
                {new Set(filteredPurchases.map(p => p.supplier)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table / Mobile Cards */}
      {isMobile ? (
        <div className="space-y-3">
          {filteredPurchases.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
              No hay compras registradas
            </div>
          ) : (
            filteredPurchases
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((purchase) => {
                const PaymentIcon = paymentIcons[purchase.paymentMethod];
                return (
                  <div key={purchase.id} className="glass-card rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{purchase.supplier}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(purchase.date).toLocaleDateString('es-MX')}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-primary">${purchase.total.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {purchase.items.slice(0, 3).map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {item.product.name} x{item.quantity}
                        </Badge>
                      ))}
                      {purchase.items.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{purchase.items.length - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{paymentLabels[purchase.paymentMethod]}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => setViewingPurchase(purchase)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-destructive"
                          onClick={() => deletePurchase(purchase.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay compras registradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((purchase) => {
                    const PaymentIcon = paymentIcons[purchase.paymentMethod];
                    return (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(purchase.date).toLocaleDateString('es-MX')}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{purchase.supplier}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {purchase.items.slice(0, 2).map((item, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {item.product.name} x{item.quantity}
                              </Badge>
                            ))}
                            {purchase.items.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{purchase.items.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                            <span>{paymentLabels[purchase.paymentMethod]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${purchase.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => setViewingPurchase(purchase)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => deletePurchase(purchase.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewingPurchase} onOpenChange={() => setViewingPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Compra</DialogTitle>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proveedor:</span>
                  <span className="font-medium">{viewingPurchase.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{new Date(viewingPurchase.date).toLocaleDateString('es-MX')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Método de pago:</span>
                  <span>{paymentLabels[viewingPurchase.paymentMethod]}</span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="font-medium mb-2">Productos:</p>
                <div className="space-y-2">
                  {viewingPurchase.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.product.name} x{item.quantity}</span>
                      <span className="font-medium">${(item.quantity * item.unitCost).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between p-3 bg-primary/10 rounded-lg font-semibold">
                <span>Total</span>
                <span>${viewingPurchase.total.toLocaleString()}</span>
              </div>
              
              {viewingPurchase.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notas: </span>
                  {viewingPurchase.notes}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
