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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  DollarSign,
  Ban,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface PurchasePayment {
  id: string;
  purchase_id: string;
  amount: number;
  payment_method: string;
  reference?: string;
  created_at: string;
  supplier?: string;
  purchase_total?: number;
}

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRightLeft,
};

const paymentLabels: Record<string, string> = {
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
  const [activeTab, setActiveTab] = useState('compras');

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

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('transfer');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Cancel confirmation state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [purchaseToCancel, setPurchaseToCancel] = useState<Purchase | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Payments history state
  const [allPayments, setAllPayments] = useState<PurchasePayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentDateFilter, setPaymentDateFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

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

  // Load payments when switching to payments tab
  useEffect(() => {
    if (activeTab === 'pagos') {
      loadAllPayments();
    }
  }, [activeTab, purchases]);

  const loadAllPayments = async () => {
    setLoadingPayments(true);
    try {
      const purchasesWithPayments = purchases.filter(p => p.paid_amount > 0);
      const paymentsPromises = purchasesWithPayments.map(async (purchase) => {
        try {
          const detail = await api.purchases.getById(purchase.id);
          return (detail.payments || []).map((pay: any) => ({
            ...pay,
            supplier: purchase.supplier,
            purchase_id: purchase.id,
            purchase_total: purchase.total,
          }));
        } catch {
          return [];
        }
      });
      
      const paymentsArrays = await Promise.all(paymentsPromises);
      const allPaymentsFlat = paymentsArrays.flat().sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAllPayments(allPaymentsFlat);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

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

  // Pending purchases sorted by urgency (due date)
  const pendingPurchases = purchases
    .filter(p => p.branch_id === currentBranch?.id && (p.status === 'pending' || p.status === 'partial'))
    .sort((a, b) => {
      const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      return dateA - dateB;
    });

  // Check if a purchase is overdue
  const isOverdue = (purchase: Purchase) => {
    if (!purchase.due_date) return false;
    return new Date(purchase.due_date) < new Date();
  };

  // Get days status (negative = overdue, positive = remaining)
  const getDaysStatus = (purchase: Purchase) => {
    if (!purchase.due_date) return null;
    return differenceInDays(new Date(purchase.due_date), new Date());
  };

  // Filtered payments for "Pagos Realizados" tab
  const filteredPayments = allPayments.filter(p => {
    const matchesDate = !paymentDateFilter || p.created_at.startsWith(paymentDateFilter);
    const matchesMethod = paymentMethodFilter === 'all' || p.payment_method === paymentMethodFilter;
    return matchesDate && matchesMethod;
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

      await api.purchases.create(purchaseData);
      
      // Reload purchases
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

  // Open payment modal
  const openPaymentModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setPaymentAmount(Number(purchase.balance));
    setPaymentMethod('transfer');
    setPaymentReference('');
    setPaymentModalOpen(true);
  };

  // Handle add payment
  const handleAddPayment = async () => {
    if (!selectedPurchase || paymentAmount <= 0) return;
    
    if (paymentAmount > Number(selectedPurchase.balance)) {
      toast.error('El monto excede el saldo pendiente');
      return;
    }
    
    setIsSubmittingPayment(true);
    try {
      await api.purchases.addPayment(selectedPurchase.id, {
        amount: paymentAmount,
        payment_method: paymentMethod,
        reference: paymentReference || null,
        shift_id: openShift?.id,
      });
      
      // Reload purchases
      const purchasesData = await api.purchases.getAll({ branch_id: currentBranch?.id });
      setPurchases(purchasesData.map((p: any) => ({
        ...p,
        items: p.items || p.lines || [],
      })));
      
      toast.success('Abono registrado correctamente');
      setPaymentModalOpen(false);
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Error al registrar abono');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Open cancel confirmation
  const openCancelDialog = (purchase: Purchase) => {
    setPurchaseToCancel(purchase);
    setCancelDialogOpen(true);
  };

  // Handle cancel purchase
  const handleCancelPurchase = async () => {
    if (!purchaseToCancel) return;
    
    setIsCancelling(true);
    try {
      await api.purchases.cancel(purchaseToCancel.id);
      
      // Reload purchases
      const purchasesData = await api.purchases.getAll({ branch_id: currentBranch?.id });
      setPurchases(purchasesData.map((p: any) => ({
        ...p,
        items: p.items || p.lines || [],
      })));
      
      toast.success('Compra cancelada correctamente');
      setCancelDialogOpen(false);
      setPurchaseToCancel(null);
    } catch (error) {
      console.error('Error cancelling purchase:', error);
      toast.error('Error al cancelar compra');
    } finally {
      setIsCancelling(false);
    }
  };

  const total = calculateTotal();
  const validLinesCount = lines.filter(l => l.productId).length;

  // Render purchase row for mobile
  const renderMobilePurchaseCard = (purchase: Purchase, showActions = false) => {
    const status = statusConfig[purchase.status] || statusConfig.pending;
    const StatusIcon = status.icon;
    const overdue = isOverdue(purchase);
    const daysStatus = getDaysStatus(purchase);
    
    return (
      <div 
        key={purchase.id} 
        className={`glass-card rounded-xl p-4 space-y-3 ${overdue ? 'border-2 border-destructive/50' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{purchase.supplier}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(purchase.date).toLocaleDateString('es-MX')}
            </div>
            {purchase.due_date && (
              <div className={`flex items-center gap-2 text-sm mt-1 ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                <Clock className="h-3.5 w-3.5" />
                Vence: {new Date(purchase.due_date).toLocaleDateString('es-MX')}
                {daysStatus !== null && (
                  <span className={overdue ? 'text-destructive' : 'text-success'}>
                    ({daysStatus < 0 ? `${Math.abs(daysStatus)} días vencida` : `${daysStatus} días restantes`})
                  </span>
                )}
              </div>
            )}
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
                Pendiente: <span className={overdue ? 'text-destructive font-medium' : 'text-warning'}>${Number(purchase.balance).toLocaleString()}</span>
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
            {showActions && (purchase.status === 'pending' || purchase.status === 'partial') && (
              <>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-success"
                  onClick={() => openPaymentModal(purchase)}
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-destructive"
                  onClick={() => openCancelDialog(purchase)}
                >
                  <Ban className="h-4 w-4" />
                </Button>
              </>
            )}
            {canDelete('compras') && purchase.status !== 'cancelled' && !showActions && (
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
  };

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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compras" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Compras</span>
          </TabsTrigger>
          <TabsTrigger value="por-pagar" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Por Pagar</span>
            {pendingPurchases.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {pendingPurchases.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pagos" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Pagos Realizados</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Compras */}
        <TabsContent value="compras" className="space-y-4">
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
                  .map((purchase) => renderMobilePurchaseCard(purchase, true))
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
                                {(purchase.status === 'pending' || purchase.status === 'partial') && (
                                  <>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 text-success"
                                      onClick={() => openPaymentModal(purchase)}
                                      title="Registrar abono"
                                    >
                                      <DollarSign className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => openCancelDialog(purchase)}
                                      title="Cancelar compra"
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                {canDelete('compras') && purchase.status !== 'cancelled' && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => deletePurchase(purchase.id)}
                                    title="Eliminar compra"
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
        </TabsContent>

        {/* Tab: Por Pagar */}
        <TabsContent value="por-pagar" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : pendingPurchases.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-lg font-medium">¡No tienes compras pendientes!</p>
              <p className="text-muted-foreground">Todas tus compras están al corriente.</p>
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {pendingPurchases.map((purchase) => renderMobilePurchaseCard(purchase, true))}
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Fecha Compra</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Pendiente</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPurchases.map((purchase) => {
                    const status = statusConfig[purchase.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const overdue = isOverdue(purchase);
                    const daysStatus = getDaysStatus(purchase);
                    
                    return (
                      <TableRow key={purchase.id} className={overdue ? 'bg-destructive/5' : ''}>
                        <TableCell className="font-medium">{purchase.supplier}</TableCell>
                        <TableCell>
                          {new Date(purchase.date).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>
                          {purchase.due_date ? (
                            <div className={`flex flex-col ${overdue ? 'text-destructive' : ''}`}>
                              <span className={overdue ? 'font-bold' : ''}>
                                {new Date(purchase.due_date).toLocaleDateString('es-MX')}
                              </span>
                              {daysStatus !== null && (
                                <span className={`text-xs ${overdue ? 'text-destructive' : 'text-success'}`}>
                                  {daysStatus < 0 ? `${Math.abs(daysStatus)} días vencida` : `${daysStatus} días restantes`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin vencimiento</span>
                          )}
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
                          <span className={`font-bold ${overdue ? 'text-destructive' : 'text-warning'}`}>
                            ${Number(purchase.balance).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-success border-success hover:bg-success/10"
                              onClick={() => openPaymentModal(purchase)}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Abonar
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => openCancelDialog(purchase)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Tab: Pagos Realizados */}
        <TabsContent value="pagos" className="space-y-4">
          {/* Filters */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Fecha</Label>
                <Input
                  type="date"
                  value={paymentDateFilter}
                  onChange={(e) => setPaymentDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="sm:w-48">
                <Label className="text-xs text-muted-foreground mb-1 block">Método de Pago</Label>
                <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(paymentDateFilter || paymentMethodFilter !== 'all') && (
                <div className="flex items-end">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setPaymentDateFilter('');
                      setPaymentMethodFilter('all');
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>

          {loadingPayments ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
              No hay pagos registrados
            </div>
          ) : isMobile ? (
            <div className="space-y-3">
              {filteredPayments.map((payment) => {
                const PaymentIcon = paymentIcons[payment.payment_method as keyof typeof paymentIcons] || Banknote;
                return (
                  <div key={payment.id} className="glass-card rounded-xl p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{payment.supplier}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(payment.created_at), 'PPp', { locale: es })}
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <PaymentIcon className="h-3 w-3" />
                        {paymentLabels[payment.payment_method] || payment.payment_method}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm text-muted-foreground">
                        {payment.reference && <span>Ref: {payment.reference}</span>}
                      </div>
                      <p className="text-lg font-bold text-success">
                        ${Number(payment.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const PaymentIcon = paymentIcons[payment.payment_method as keyof typeof paymentIcons] || Banknote;
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {format(new Date(payment.created_at), 'PPp', { locale: es })}
                        </TableCell>
                        <TableCell className="font-medium">{payment.supplier}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <PaymentIcon className="h-3 w-3" />
                            {paymentLabels[payment.payment_method] || payment.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.reference || '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold text-success">
                          ${Number(payment.amount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {filteredPayments.length > 0 && (
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total de pagos mostrados:</span>
                <span className="text-xl font-bold text-success">
                  ${filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

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

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Abono</DialogTitle>
            <DialogDescription>
              Registra un pago parcial o total para esta compra.
            </DialogDescription>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              {/* Purchase summary */}
              <div className="p-4 bg-secondary/30 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Proveedor</span>
                  <span className="font-medium">{selectedPurchase.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de compra</span>
                  <span className="font-medium">${Number(selectedPurchase.total).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ya pagado</span>
                  <span className="text-success">${Number(selectedPurchase.paid_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Saldo pendiente</span>
                  <span className="font-bold text-warning">${Number(selectedPurchase.balance).toLocaleString()}</span>
                </div>
              </div>

              {/* Payment form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Monto a abonar</Label>
                  <Input
                    type="number"
                    min="0"
                    max={Number(selectedPurchase.balance)}
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="text-lg"
                  />
                  {paymentAmount > Number(selectedPurchase.balance) && (
                    <p className="text-xs text-destructive">El monto excede el saldo pendiente</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Método de pago</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Referencia (opcional)</Label>
                  <Input
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ej: Número de transferencia, cheque, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-bg border-0"
                  onClick={handleAddPayment}
                  disabled={paymentAmount <= 0 || paymentAmount > Number(selectedPurchase.balance) || isSubmittingPayment}
                >
                  {isSubmittingPayment ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <DollarSign className="h-4 w-4 mr-2" />
                  )}
                  Registrar Abono
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar esta compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará la compra y revertirá el inventario de los productos asociados. 
              {purchaseToCancel?.paid_amount && purchaseToCancel.paid_amount > 0 && (
                <span className="block mt-2 text-warning font-medium">
                  Nota: Esta compra tiene ${Number(purchaseToCancel.paid_amount).toLocaleString()} en pagos registrados.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>No, mantener</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelPurchase}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Sí, cancelar compra
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
