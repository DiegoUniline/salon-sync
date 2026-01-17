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
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  credit_days: number;
  credit_limit: number;
  balance: number;
}

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
  supplier_id?: string;
  date: string;
  supplier: string;
  items: PurchaseItem[];
  total: number;
  payment_type: 'cash' | 'credit';
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  due_date?: string;
  paid_amount: number;
  balance: number;
  payment_method?: string;
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

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
  partial: { label: 'Parcial', color: 'bg-blue-500/10 text-blue-600', icon: AlertCircle },
  paid: { label: 'Pagada', color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/10 text-red-600', icon: XCircle },
};

export default function Compras() {
  const { currentBranch } = useApp();
  const { canCreate, canDelete } = usePermissions();
  const { hasOpenShift, openShift, loading: shiftLoading } = useShift(currentBranch?.id || '');
  const isMobile = useIsMobile();
  
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  // Form state
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [dueDate, setDueDate] = useState('');
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
        const [purchasesData, productsData, suppliersData] = await Promise.all([
          api.purchases.getAll({ branch_id: currentBranch.id }),
          api.products.getAll(),
          api.suppliers.getAll({ active: true }),
        ]);
        setPurchases(purchasesData.map((p: any) => ({
          ...p,
          items: p.items || p.lines || [],
        })));
        setProducts(productsData.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          cost: parseFloat(p.cost) || 0,
          stock: p.stock || 0,
        })));
        setSuppliers(suppliersData);
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
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesBranch && matchesSearch && matchesStatus;
  });

  const totalCompras = filteredPurchases.reduce((sum, p) => sum + Number(p.total), 0);
  const totalPendiente = filteredPurchases
    .filter(p => p.status === 'pending' || p.status === 'partial')
    .reduce((sum, p) => sum + Number(p.balance), 0);

  const calculateTotal = () => {
    return lines.reduce((sum, line) => sum + line.subtotal, 0);
  };

  const resetForm = () => {
    setSupplierId('');
    setSupplierName('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentType('cash');
    setDueDate('');
    setNotes('');
    setLines([]);
    setPayments([{ id: 'pay-1', method: 'transfer', amount: 0 }]);
  };

  const handleSupplierChange = (value: string) => {
    setSupplierId(value);
    const selected = suppliers.find(s => s.id === value);
    if (selected) {
      setSupplierName(selected.name);
      if (selected.credit_days > 0) {
        const due = new Date();
        due.setDate(due.getDate() + selected.credit_days);
        setDueDate(due.toISOString().split('T')[0]);
      }
    }
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
    const finalSupplier = supplierName || (suppliers.find(s => s.id === supplierId)?.name);
    
    if (!finalSupplier) {
      toast.error('Selecciona o ingresa un proveedor');
      return;
    }
    
    const validLines = lines.filter(l => l.productId);
    if (validLines.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    const total = calculateTotal();
    const totalPaid = paymentType === 'cash' 
      ? payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
      : 0;
    
    if (paymentType === 'cash' && totalPaid < total) {
      toast.error('El monto pagado es menor al total');
      return;
    }

    try {
      const purchaseData = {
        branch_id: currentBranch?.id,
        shift_id: openShift?.id,
        supplier_id: supplierId || null,
        date,
        supplier: finalSupplier,
        items: validLines.map(line => ({
          product_id: line.productId,
          product_name: line.productName,
          quantity: line.quantity,
          unit_cost: line.unitCost,
        })),
        total,
        payment_type: paymentType,
        due_date: paymentType === 'credit' ? dueDate : null,
        payments: paymentType === 'cash' ? payments.filter(p => Number(p.amount) > 0) : [],
        notes: notes || null,
      };

      const newPurchase = await api.purchases.create(purchaseData);
      
      // Recargar compras
      const purchasesData = await api.purchases.getAll({ branch_id: currentBranch?.id });
      setPurchases(purchasesData.map((p: any) => ({
        ...p,
        items: p.items || p.lines || [],
      })));
      
      toast.success('Compra registrada correctamente');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating purchase:', error);
      toast.error('Error al registrar compra');
    }
  };

  const deletePurchase = async (id: string) => {
    if (!confirm('¿Eliminar esta compra? Se revertirá el inventario.')) return;
    
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
              {/* Proveedor */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  {suppliers.length > 0 ? (
                    <Select value={supplierId} onValueChange={handleSupplierChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar proveedor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Nombre del proveedor"
                    />
                  )}
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

              {/* Tipo de pago */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Compra</Label>
                  <Select value={paymentType} onValueChange={(v: 'cash' | 'credit') => setPaymentType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Contado</SelectItem>
                      <SelectItem value="credit">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentType === 'credit' && (
                  <div className="space-y-2">
                    <Label>Fecha de Vencimiento</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Products */}
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

              {/* Payments - solo si es contado */}
              {paymentType === 'cash' && (
                <MultiPaymentSelector
                  payments={payments}
                  onChange={setPayments}
                  total={total}
                />
              )}

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
              {((!supplierId && !supplierName) || validLinesCount === 0) && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm space-y-1">
                  <p className="font-medium text-destructive">Para registrar la compra necesitas:</p>
                  {!supplierId && !supplierName && <p className="text-destructive/80">• Seleccionar o ingresar un proveedor</p>}
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
                  disabled={(!supplierId && !supplierName) || validLinesCount === 0}
                >
                  Registrar Compra
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
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
            <div className="p-3 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Por Pagar</p>
              <p className="text-2xl font-bold">${totalPendiente.toLocaleString()}</p>
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por proveedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="partial">Parciales</SelectItem>
              <SelectItem value="paid">Pagadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
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
                const status = statusConfig[purchase.status] || statusConfig.pending;
                const StatusIcon = status.icon;
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
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {purchase.items?.slice(0, 3).map((item, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {item.product_name} x{item.quantity}
                        </Badge>
                      ))}
                      {(purchase.items?.length || 0) > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{(purchase.items?.length || 0) - 3}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-lg font-bold">${Number(purchase.total).toLocaleString()}</p>
                        {purchase.balance > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Pendiente: ${Number(purchase.balance).toLocaleString()}
                          </p>
                        )}
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
                        {canDelete('compras') && purchase.status !== 'cancelled' && (
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
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay compras registradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchases
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((purchase) => {
                    const status = statusConfig[purchase.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
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
                            {purchase.items?.slice(0, 2).map((item, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {item.product_name} x{item.quantity}
                              </Badge>
                            ))}
                            {(purchase.items?.length || 0) > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{(purchase.items?.length || 0) - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {purchase.payment_type === 'credit' ? 'Crédito' : 'Contado'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          ${Number(purchase.total).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {purchase.balance > 0 ? (
                            <span className="text-warning font-medium">
                              ${Number(purchase.balance).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
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
                            {canDelete('compras') && purchase.status !== 'cancelled' && (
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
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {viewingPurchase.payment_type === 'credit' ? 'Crédito' : 'Contado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge className={statusConfig[viewingPurchase.status]?.color}>
                    {statusConfig[viewingPurchase.status]?.label}
                  </Badge>
                </div>
                {viewingPurchase.due_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Vencimiento</p>
                    <p className="font-medium">{new Date(viewingPurchase.due_date).toLocaleDateString('es-MX')}</p>
                  </div>
                )}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Productos</p>
                <div className="space-y-2">
                  {viewingPurchase.items?.map((item, index) => (
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
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-bold">${Number(viewingPurchase.total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pagado</span>
                  <span className="text-success">${Number(viewingPurchase.paid_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pendiente</span>
                  <span className="text-warning font-bold">${Number(viewingPurchase.balance || 0).toLocaleString()}</span>
                </div>
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
