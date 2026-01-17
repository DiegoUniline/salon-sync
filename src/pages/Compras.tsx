import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/lib/api';
import { ShiftRequiredAlert } from '@/components/ShiftRequiredAlert';
import { useShift } from '@/hooks/useShift';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SimplePurchaseLineEditor, type PurchaseLine, type ProductOption } from '@/components/SimplePurchaseLineEditor';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
}

interface Purchase {
  id: string;
  branch_id: string;
  shift_id?: string;
  date: string;
  supplier: string;
  lines: PurchaseItem[];
  total: number;
  payment_method: string;
  notes?: string;
}

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
  const { hasOpenShift, openShift, loading: shiftLoading } = useShift(currentBranch?.id || '');
  const isMobile = useIsMobile();
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  // Form state
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<PurchaseLine[]>([]);
  const [payments, setPayments] = useState<Payment[]>([
    { id: 'pay-1', method: 'transfer', amount: 0 }
  ]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!currentBranch?.id) return;
      setLoading(true);
      try {
        const [purchasesData, productsData] = await Promise.all([
          api.purchases.getAll({ branch_id: currentBranch.id }),
          api.products.getAll(),
        ]);
        setPurchases(purchasesData.map((p: any) => ({
          ...p,
          branch_id: p.branch_id,
          payment_method: p.payment_method || p.paymentMethod,
        })));
        setProducts(productsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          cost: parseFloat(p.cost) || 0,
          stock: p.stock || 0,
        })));
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentBranch?.id]);

  // Require open shift for purchases
  if (shiftLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
    const matchesBranch = p.branch_id === currentBranch?.id;
    const matchesSearch = p.supplier.toLowerCase().includes(search.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const totalCompras = filteredPurchases.reduce((sum, p) => sum + Number(p.total), 0);

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + line.subtotal, 0);
  };

  const resetForm = () => {
    setSupplier('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setLines([]);
    setPayments([{ id: 'pay-1', method: 'transfer', amount: 0 }]);
  };

  const addLine = () => {
    setLines(prev => [
      ...prev,
      { 
        id: `line-${Date.now()}`, 
        productId: '', 
        productName: '', 
        quantity: 1, 
        unitCost: 0, 
        subtotal: 0 
      }
    ]);
  };

  const updateLine = (lineId: string, updates: Partial<PurchaseLine>) => {
    setLines(prev => prev.map(line => 
      line.id === lineId ? { ...line, ...updates } : line
    ));
  };

  const removeLine = (lineId: string) => {
    setLines(prev => prev.filter(line => line.id !== lineId));
  };

  const handleSubmit = async () => {
    if (!supplier) {
      toast.error('Ingresa el proveedor');
      return;
    }
    
    const validLines = lines.filter(l => l.productId);
    if (validLines.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    const total = calculateTotal();
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    if (totalPaid < total) {
      toast.error('El monto pagado es menor al total');
      return;
    }

    try {
      const purchaseData = {
        branch_id: currentBranch?.id,
        shift_id: openShift?.id,
        date,
        supplier,
        lines: validLines.map(line => ({
          product_id: line.productId,
          product_name: line.productName,
          quantity: line.quantity,
          unit_cost: line.unitCost,
          subtotal: line.quantity * line.unitCost,
        })),
        total,
        payment_method: payments.length > 1 ? 'transfer' : payments[0].method,
        notes: notes || null,
      };

      const newPurchase = await api.purchases.create(purchaseData);
      setPurchases(prev => [{ ...purchaseData, id: newPurchase.id } as Purchase, ...prev]);
      
      toast.success('Compra registrada correctamente');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Error al registrar compra');
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      await api.purchases.delete(id);
      setPurchases(prev => prev.filter(p => p.id !== id));
      toast.success('Compra eliminada');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast.error('Error al eliminar compra');
    }
  };

  const total = calculateTotal();
  const validLinesCount = lines.filter(l => l.productId).length;

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
              <DialogDescription>
                Registra una nueva compra de productos a un proveedor.
              </DialogDescription>
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

              {/* Products - Simple version */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Productos</Label>
                <SimplePurchaseLineEditor
                  lines={lines}
                  products={products}
                  onAddLine={addLine}
                  onUpdateLine={updateLine}
                  onRemoveLine={removeLine}
                  total={total}
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

              {/* Validation feedback */}
              {(!supplier || validLinesCount === 0) && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm space-y-1">
                  <p className="font-medium text-destructive">Para registrar la compra necesitas:</p>
                  {!supplier && <p className="text-destructive/80">• Ingresar el nombre del proveedor</p>}
                  {validLinesCount === 0 && (
                    <p className="text-destructive/80">• Agregar al menos un producto</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-bg border-0"
                  onClick={handleSubmit}
                  disabled={!supplier || validLinesCount === 0}
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

      {/* Purchases List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filteredPurchases.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
              No hay compras registradas
            </div>
          ) : (
            filteredPurchases
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((purchase) => {
                const PaymentIcon = paymentIcons[purchase.payment_method as keyof typeof paymentIcons] || ArrowRightLeft;
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
                      <p className="text-lg font-bold text-primary">${Number(purchase.total).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {purchase.lines?.slice(0, 3).map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {item.product_name} x{item.quantity}
                        </Badge>
                      ))}
                      {(purchase.lines?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(purchase.lines?.length || 0) - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{paymentLabels[purchase.payment_method as keyof typeof paymentLabels] || purchase.payment_method}</span>
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
                        {canDelete('compras') && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deletePurchase(purchase.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
                    const PaymentIcon = paymentIcons[purchase.payment_method as keyof typeof paymentIcons] || ArrowRightLeft;
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
                            {purchase.lines?.slice(0, 2).map((item, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {item.product_name} x{item.quantity}
                              </Badge>
                            ))}
                            {(purchase.lines?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(purchase.lines?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                            {paymentLabels[purchase.payment_method as keyof typeof paymentLabels] || purchase.payment_method}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">${Number(purchase.total).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => setViewingPurchase(purchase)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canDelete('compras') && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => deletePurchase(purchase.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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

      {/* View Purchase Dialog */}
      <Dialog open={!!viewingPurchase} onOpenChange={() => setViewingPurchase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Compra</DialogTitle>
          </DialogHeader>
          {viewingPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Proveedor</p>
                  <p className="font-medium">{viewingPurchase.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{new Date(viewingPurchase.date).toLocaleDateString('es-MX')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <p className="font-medium">{paymentLabels[viewingPurchase.payment_method as keyof typeof paymentLabels] || viewingPurchase.payment_method}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Productos</p>
                <div className="space-y-2">
                  {viewingPurchase.lines?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-secondary/30 rounded">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{item.product_name}</span>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                      </div>
                      <span className="font-medium">
                        ${(item.quantity * item.unit_cost).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold">${Number(viewingPurchase.total).toLocaleString()}</span>
              </div>
              
              {viewingPurchase.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Notas</p>
                  <p>{viewingPurchase.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
