import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  purchases as mockPurchases,
  products,
  type Purchase,
  type Product,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';
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
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

  const [formData, setFormData] = useState({
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'transfer' as 'cash' | 'card' | 'transfer',
    notes: '',
    items: [] as { productId: string; quantity: number; unitCost: number }[],
  });

  const filteredPurchases = purchases.filter(p => {
    const matchesBranch = p.branchId === currentBranch.id;
    const matchesSearch = p.supplier.toLowerCase().includes(search.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  const totalCompras = filteredPurchases.reduce((sum, p) => sum + p.total, 0);

  const resetForm = () => {
    setFormData({
      supplier: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'transfer',
      notes: '',
      items: [],
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, unitCost: 0 }],
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product) updated.unitCost = product.cost;
        }
        return updated;
      }),
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
  };

  const handleSubmit = () => {
    if (!formData.supplier || formData.items.length === 0) {
      toast.error('Completa los datos de la compra');
      return;
    }

    const newPurchase: Purchase = {
      id: `pu${Date.now()}`,
      branchId: currentBranch.id,
      date: formData.date,
      supplier: formData.supplier,
      items: formData.items.map(item => ({
        product: products.find(p => p.id === item.productId)!,
        quantity: item.quantity,
        unitCost: item.unitCost,
      })),
      total: calculateTotal(),
      paymentMethod: formData.paymentMethod,
      notes: formData.notes,
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
            <Button className="gradient-bg border-0">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Compra</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Nombre del proveedor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select 
                  value={formData.paymentMethod} 
                  onValueChange={(v: 'cash' | 'card' | 'transfer') => setFormData(prev => ({ ...prev, paymentMethod: v }))}
                >
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

              {/* Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Productos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
                
                {formData.items.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
                    Agrega productos a la compra
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                        <Select 
                          value={item.productId}
                          onValueChange={(v) => updateItem(index, 'productId', v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20"
                          placeholder="Cant."
                        />
                        <Input
                          type="number"
                          min={0}
                          value={item.unitCost}
                          onChange={(e) => updateItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                          className="w-24"
                          placeholder="Costo"
                        />
                        <span className="w-24 text-right font-medium">
                          ${(item.quantity * item.unitCost).toLocaleString()}
                        </span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                <span className="font-medium">Total de la Compra</span>
                <span className="text-2xl font-bold">${calculateTotal().toLocaleString()}</span>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-bg border-0"
                  onClick={handleSubmit}
                  disabled={!formData.supplier || formData.items.length === 0}
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

      {/* Table */}
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
                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-secondary/30 rounded">
                      <span>{item.product.name}</span>
                      <span>
                        {item.quantity} x ${item.unitCost} = ${(item.quantity * item.unitCost).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                <span className="font-medium">Total:</span>
                <span className="text-xl font-bold">${viewingPurchase.total.toLocaleString()}</span>
              </div>

              {viewingPurchase.notes && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Notas:</p>
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
