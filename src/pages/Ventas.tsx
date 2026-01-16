import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/lib/api';
import { TicketPrinter, type TicketData } from '@/components/TicketPrinter';
import { ShiftRequiredAlert } from '@/components/ShiftRequiredAlert';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Layers,
  Trash2,
  Eye,
  ShoppingBag,
  Scissors,
  Package,
  Receipt,
  DollarSign,
  Minus,
  X,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const paymentIcons = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRightLeft,
  mixed: Layers,
};

const paymentLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  mixed: 'Mixto',
};

interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  sku: string;
  active: boolean;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  active: boolean;
}

interface Sale {
  id: string;
  branch_id: string;
  shift_id?: string;
  date: string;
  time: string;
  type: 'direct' | 'appointment';
  items: { type: 'product' | 'service'; item: Product | Service; quantity: number }[];
  payment_method: string;
  payments?: { method: string; amount: number }[];
  total: number;
  client_name?: string;
}

interface CartItem {
  type: 'product' | 'service';
  item: Product | Service;
  quantity: number;
}

export default function Ventas() {
  const { currentBranch } = useApp();
  const { canCreate, canDelete } = usePermissions();
  const { hasOpenShift, openShift, loading: shiftLoading } = useShift(currentBranch?.id || '');
  const isMobile = useIsMobile();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isPOSOpen, setIsPOSOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer' | 'mixed'>('cash');
  const [mixedPayments, setMixedPayments] = useState<{ method: 'cash' | 'card' | 'transfer'; amount: number }[]>([]);
  const [searchPOS, setSearchPOS] = useState('');
  
  // Ticket state
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!currentBranch?.id) return;
      setLoading(true);
      try {
        const [salesData, productsData, servicesData] = await Promise.all([
          api.sales.getAll({ branch_id: currentBranch.id }),
          api.products.getAll({ active: true }),
          api.services.getAll({ active: true }),
        ]);
        setSales(salesData.map((s: any) => ({
          ...s,
          branch_id: s.branch_id,
          payment_method: s.payment_method || s.paymentMethod,
        })));
        setProducts(productsData);
        setServices(servicesData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentBranch?.id]);

  // Require open shift for sales
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
          <h1 className="text-2xl font-bold">Ventas</h1>
          <p className="text-muted-foreground">Punto de venta y registro</p>
        </div>
        <ShiftRequiredAlert action="registrar ventas" />
      </div>
    );
  }

  const filteredSales = sales.filter(s => {
    const matchesBranch = s.branch_id === currentBranch?.id;
    const matchesSearch = s.client_name?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    return matchesBranch && matchesSearch && matchesType;
  });

  const today = new Date().toISOString().split('T')[0];
  const todaySales = filteredSales.filter(s => s.date === today);
  const totalToday = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const cashToday = todaySales.filter(s => s.payment_method === 'cash').reduce((sum, s) => sum + Number(s.total), 0);
  const cardToday = todaySales.filter(s => s.payment_method === 'card').reduce((sum, s) => sum + Number(s.total), 0);

  const cartTotal = cart.reduce((sum, item) => {
    const price = 'price' in item.item ? item.item.price : 0;
    return sum + (Number(price) * item.quantity);
  }, 0);

  const addToCart = (type: 'product' | 'service', item: Product | Service) => {
    setCart(prev => {
      const existing = prev.find(c => c.type === type && c.item.id === item.id);
      if (existing) {
        return prev.map(c => 
          c.type === type && c.item.id === item.id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { type, item, quantity: 1 }];
    });
  };

  const updateCartQuantity = (type: 'product' | 'service', itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.type === type && c.item.id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const removeFromCart = (type: 'product' | 'service', itemId: string) => {
    setCart(prev => prev.filter(c => !(c.type === type && c.item.id === itemId)));
  };

  const addMixedPayment = () => {
    setMixedPayments(prev => [...prev, { method: 'cash', amount: 0 }]);
  };

  const updateMixedPayment = (index: number, field: 'method' | 'amount', value: string | number) => {
    setMixedPayments(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  const removeMixedPayment = (index: number) => {
    setMixedPayments(prev => prev.filter((_, i) => i !== index));
  };

  const mixedTotal = mixedPayments.reduce((sum, p) => sum + p.amount, 0);

  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (paymentMethod === 'mixed' && mixedTotal !== cartTotal) {
      toast.error('El total de pagos no coincide con el total de la venta');
      return;
    }

    const now = new Date();
    const folio = `V${Date.now().toString().slice(-6)}`;
    
    try {
      const saleData = {
        branch_id: currentBranch?.id,
        shift_id: openShift?.id,
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().slice(0, 5),
        type: 'direct',
        items: cart.map(c => ({
          type: c.type,
          item_id: c.item.id,
          name: c.item.name,
          quantity: c.quantity,
          price: 'price' in c.item ? c.item.price : 0,
        })),
        payment_method: paymentMethod,
        payments: paymentMethod === 'mixed' ? mixedPayments : [{ method: paymentMethod, amount: cartTotal }],
        total: cartTotal,
        client_name: clientName || 'Cliente mostrador',
      };

      const newSale = await api.sales.create(saleData);
      // Reload sales to get proper structure
      const updatedSales = await api.sales.getAll({ branch_id: currentBranch?.id });
      setSales(updatedSales.map((s: any) => ({
        ...s,
        branch_id: s.branch_id,
        payment_method: s.payment_method || s.paymentMethod,
      })));
      
      // Prepare ticket data
      const serviceItems = cart.filter(c => c.type === 'service').map(c => ({
        name: c.item.name,
        quantity: c.quantity,
        price: 'price' in c.item ? Number(c.item.price) : 0,
      }));
      
      const productItems = cart.filter(c => c.type === 'product').map(c => ({
        name: c.item.name,
        quantity: c.quantity,
        price: 'price' in c.item ? Number(c.item.price) : 0,
      }));
      
      setTicketData({
        folio,
        date: now,
        clientName: clientName || 'Cliente mostrador',
        services: serviceItems,
        products: productItems,
        subtotal: cartTotal,
        discount: 0,
        total: cartTotal,
        paymentMethod: paymentLabels[paymentMethod],
        payments: paymentMethod === 'mixed' ? mixedPayments.map(p => ({
          method: paymentLabels[p.method as keyof typeof paymentLabels],
          amount: p.amount
        })) : undefined,
      });
      
      setShowTicket(true);
      toast.success('Venta completada');
      
      // Reset
      setCart([]);
      setClientName('');
      setPaymentMethod('cash');
      setMixedPayments([]);
      setIsPOSOpen(false);
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Error al registrar venta');
    }
  };

  const filteredProducts = products.filter(p => 
    p.active && p.stock > 0 &&
    (p.name.toLowerCase().includes(searchPOS.toLowerCase()) || p.sku.toLowerCase().includes(searchPOS.toLowerCase()))
  );

  const filteredServices = services.filter(s => 
    s.active &&
    s.name.toLowerCase().includes(searchPOS.toLowerCase())
  );

  const deleteSale = async (id: string) => {
    try {
      await api.sales.delete(id);
      setSales(prev => prev.filter(s => s.id !== id));
      toast.success('Venta eliminada');
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Error al eliminar venta');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ventas</h1>
          <p className="text-muted-foreground">Punto de venta y registro</p>
        </div>
        <Dialog open={isPOSOpen} onOpenChange={setIsPOSOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg border-0" disabled={!canCreate('ventas')}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Punto de Venta</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[70vh]">
              {/* Products/Services Panel */}
              <div className="flex flex-col h-full border rounded-lg overflow-hidden">
                <div className="p-3 border-b bg-secondary/30">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar productos o servicios..."
                      value={searchPOS}
                      onChange={(e) => setSearchPOS(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Tabs defaultValue="products" className="flex-1 flex flex-col">
                  <TabsList className="mx-3 mt-2">
                    <TabsTrigger value="products" className="gap-1">
                      <Package className="h-4 w-4" />
                      Productos
                    </TabsTrigger>
                    <TabsTrigger value="services" className="gap-1">
                      <Scissors className="h-4 w-4" />
                      Servicios
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="products" className="flex-1 overflow-y-auto p-3 m-0">
                    <div className="grid gap-2">
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => addToCart('product', product)}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-primary/10 hover:border-primary/50 transition-all text-left"
                        >
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                          </div>
                          <span className="font-bold">${Number(product.price).toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="services" className="flex-1 overflow-y-auto p-3 m-0">
                    <div className="grid gap-2">
                      {filteredServices.map(service => (
                        <button
                          key={service.id}
                          onClick={() => addToCart('service', service)}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-primary/10 hover:border-primary/50 transition-all text-left"
                        >
                          <div className="p-2 rounded-lg bg-accent/30">
                            <Scissors className="h-4 w-4 text-accent-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.duration} min</p>
                          </div>
                          <span className="font-bold">${Number(service.price).toLocaleString()}</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Cart Panel */}
              <div className="flex flex-col h-full border rounded-lg overflow-hidden">
                <div className="p-3 border-b bg-secondary/30">
                  <Input
                    placeholder="Nombre del cliente (opcional)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                  {cart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Carrito vacío</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={`${item.type}-${item.item.id}`} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.item.name}</p>
                            <p className="text-xs text-muted-foreground">
                              ${Number('price' in item.item ? item.item.price : 0).toLocaleString()} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-7 w-7"
                              onClick={() => updateCartQuantity(item.type, item.item.id, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-7 w-7"
                              onClick={() => updateCartQuantity(item.type, item.item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="w-20 text-right font-bold">
                            ${(Number('price' in item.item ? item.item.price : 0) * item.quantity).toLocaleString()}
                          </span>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeFromCart(item.type, item.item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t space-y-3 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Total:</span>
                    <span className="text-2xl font-bold">${cartTotal.toLocaleString()}</span>
                  </div>

                  <div className="space-y-2">
                    <Label>Método de Pago</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['cash', 'card', 'transfer', 'mixed'] as const).map(method => {
                        const Icon = paymentIcons[method];
                        return (
                          <Button
                            key={method}
                            variant={paymentMethod === method ? 'default' : 'outline'}
                            className={cn("flex-col h-auto py-2", paymentMethod === method && "gradient-bg border-0")}
                            onClick={() => setPaymentMethod(method)}
                          >
                            <Icon className="h-4 w-4 mb-1" />
                            <span className="text-xs">{paymentLabels[method]}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {paymentMethod === 'mixed' && (
                    <div className="space-y-2 p-3 bg-background rounded-lg">
                      <div className="flex items-center justify-between">
                        <Label>Pagos Múltiples</Label>
                        <Button size="sm" variant="outline" onClick={addMixedPayment}>
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar
                        </Button>
                      </div>
                      {mixedPayments.map((payment, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Select
                            value={payment.method}
                            onValueChange={(v) => updateMixedPayment(index, 'method', v)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Efectivo</SelectItem>
                              <SelectItem value="card">Tarjeta</SelectItem>
                              <SelectItem value="transfer">Transfer.</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="relative flex-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              value={payment.amount}
                              onChange={(e) => updateMixedPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                              className="pl-6"
                            />
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => removeMixedPayment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm">
                        <span>Total pagos:</span>
                        <span className={cn("font-bold", mixedTotal !== cartTotal && "text-destructive")}>
                          ${mixedTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full gradient-bg border-0"
                    size="lg"
                    onClick={completeSale}
                    disabled={cart.length === 0}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Completar Venta
                  </Button>
                </div>
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
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ventas de Hoy</p>
              <p className="text-2xl font-bold">${totalToday.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <Banknote className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Efectivo</p>
              <p className="text-2xl font-bold">${cashToday.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-info/10">
              <CreditCard className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tarjeta</p>
              <p className="text-2xl font-bold">${cardToday.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="direct">Directas</SelectItem>
              <SelectItem value="appointment">De Citas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sales Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {filteredSales.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
              No hay ventas registradas
            </div>
          ) : (
            filteredSales
              .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
              .map((sale) => {
                const PaymentIcon = paymentIcons[sale.payment_method as keyof typeof paymentIcons] || Banknote;
                return (
                  <div key={sale.id} className="glass-card rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{sale.client_name || 'Cliente'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(sale.date).toLocaleDateString('es-MX')}
                          <Clock className="h-3.5 w-3.5 ml-2" />
                          {sale.time}
                        </div>
                      </div>
                      <p className="text-lg font-bold text-primary">${Number(sale.total).toLocaleString()}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Badge variant={sale.type === 'direct' ? 'default' : 'secondary'}>
                          {sale.type === 'direct' ? 'Directa' : 'Cita'}
                        </Badge>
                        <Badge variant="outline" className="gap-1">
                          <PaymentIcon className="h-3 w-3" />
                          {paymentLabels[sale.payment_method as keyof typeof paymentLabels] || sale.payment_method}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8"
                          onClick={() => setViewingSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canDelete('ventas') && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteSale(sale.id)}
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
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay ventas registradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales
                  .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
                  .map((sale) => {
                    const PaymentIcon = paymentIcons[sale.payment_method as keyof typeof paymentIcons] || Banknote;
                    return (
                      <TableRow key={sale.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p>{new Date(sale.date).toLocaleDateString('es-MX')}</p>
                              <p className="text-sm text-muted-foreground">{sale.time}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{sale.client_name || 'Cliente'}</TableCell>
                        <TableCell>
                          <Badge variant={sale.type === 'direct' ? 'default' : 'secondary'}>
                            {sale.type === 'direct' ? 'Directa' : 'Cita'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <PaymentIcon className="h-3 w-3" />
                            {paymentLabels[sale.payment_method as keyof typeof paymentLabels] || sale.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">${Number(sale.total).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-8 w-8"
                              onClick={() => setViewingSale(sale)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canDelete('ventas') && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-destructive"
                                onClick={() => deleteSale(sale.id)}
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

      {/* View Sale Dialog */}
      <Dialog open={!!viewingSale} onOpenChange={() => setViewingSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
          </DialogHeader>
          {viewingSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{viewingSale.client_name || 'Cliente'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">{new Date(viewingSale.date).toLocaleDateString('es-MX')} {viewingSale.time}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <Badge variant={viewingSale.type === 'direct' ? 'default' : 'secondary'}>
                    {viewingSale.type === 'direct' ? 'Directa' : 'Cita'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Método de Pago</p>
                  <p className="font-medium">{paymentLabels[viewingSale.payment_method as keyof typeof paymentLabels] || viewingSale.payment_method}</p>
                </div>
              </div>
              
              {viewingSale.items && viewingSale.items.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Items</p>
                  <div className="space-y-2">
                    {viewingSale.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-secondary/30 rounded">
                        <div className="flex items-center gap-2">
                          {item.type === 'product' ? (
                            <Package className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Scissors className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span>{item.item?.name || 'Item'}</span>
                          <span className="text-muted-foreground">x{item.quantity}</span>
                        </div>
                        <span className="font-medium">
                          ${(Number('price' in item.item ? item.item.price : 0) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-medium">Total</span>
                <span className="text-2xl font-bold">${Number(viewingSale.total).toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ticket Printer */}
      {showTicket && ticketData && (
        <TicketPrinter
          data={ticketData}
          open={showTicket}
          onOpenChange={setShowTicket}
        />
      )}
    </div>
  );
}
