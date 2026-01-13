import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  sales as mockSales,
  products,
  services,
  stylists,
  type Sale,
  type Product,
  type Service,
} from '@/lib/mockData';
import { TicketPrinter, type TicketData } from '@/components/TicketPrinter';
import { ShiftRequiredAlert } from '@/components/ShiftRequiredAlert';
import { useShift } from '@/hooks/useShift';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
} from 'lucide-react';
import { toast } from 'sonner';

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

interface CartItem {
  type: 'product' | 'service';
  item: Product | Service;
  quantity: number;
}

export default function Ventas() {
  const { currentBranch } = useApp();
  const { hasOpenShift, openShift } = useShift(currentBranch.id);
  const [sales, setSales] = useState<Sale[]>(mockSales);
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

  // Require open shift for sales
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
    const matchesBranch = s.branchId === currentBranch.id;
    const matchesSearch = s.clientName?.toLowerCase().includes(search.toLowerCase()) || false;
    const matchesType = typeFilter === 'all' || s.type === typeFilter;
    return matchesBranch && matchesSearch && matchesType;
  });

  const today = new Date().toISOString().split('T')[0];
  const todaySales = filteredSales.filter(s => s.date === today);
  const totalToday = todaySales.reduce((sum, s) => sum + s.total, 0);
  const cashToday = todaySales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
  const cardToday = todaySales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);

  const cartTotal = cart.reduce((sum, item) => {
    const price = 'price' in item.item ? item.item.price : 0;
    return sum + (price * item.quantity);
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

  const completeSale = () => {
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
    const newSale: Sale = {
      id: `sl${Date.now()}`,
      branchId: currentBranch.id,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      type: 'direct',
      items: cart.map(c => ({ type: c.type, item: c.item, quantity: c.quantity })),
      paymentMethod,
      payments: paymentMethod === 'mixed' ? mixedPayments : undefined,
      total: cartTotal,
      clientName: clientName || 'Cliente mostrador',
    };

    setSales(prev => [newSale, ...prev]);
    
    // Prepare ticket data
    const serviceItems = cart.filter(c => c.type === 'service').map(c => ({
      name: c.item.name,
      quantity: c.quantity,
      price: 'price' in c.item ? c.item.price : 0,
    }));
    
    const productItems = cart.filter(c => c.type === 'product').map(c => ({
      name: c.item.name,
      quantity: c.quantity,
      price: 'price' in c.item ? c.item.price : 0,
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
        method: paymentLabels[p.method],
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
  };

  const filteredProducts = products.filter(p => 
    p.active && p.stock > 0 &&
    (p.name.toLowerCase().includes(searchPOS.toLowerCase()) || p.sku.toLowerCase().includes(searchPOS.toLowerCase()))
  );

  const filteredServices = services.filter(s => 
    s.active &&
    s.name.toLowerCase().includes(searchPOS.toLowerCase())
  );

  const deleteSale = (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
    toast.success('Venta eliminada');
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
            <Button className="gradient-bg border-0">
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
                          <span className="font-bold">${product.price}</span>
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
                          <span className="font-bold">${service.price}</span>
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
                              ${('price' in item.item ? item.item.price : 0)} c/u
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
                            ${(('price' in item.item ? item.item.price : 0) * item.quantity).toLocaleString()}
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
                              <SelectItem value="transfer">Transferencia</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={payment.amount}
                            onChange={(e) => updateMixedPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                            className="flex-1"
                          />
                          <Button 
                            size="icon" 
                            variant="ghost"
                            onClick={() => removeMixedPayment(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm">
                        <span>Total pagos:</span>
                        <span className={cn("font-medium", mixedTotal !== cartTotal && "text-destructive")}>
                          ${mixedTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full gradient-bg border-0 h-12 text-lg"
                    onClick={completeSale}
                    disabled={cart.length === 0}
                  >
                    <Receipt className="h-5 w-5 mr-2" />
                    Cobrar ${cartTotal.toLocaleString()}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ventas Hoy</p>
              <p className="text-2xl font-bold">${totalToday.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transacciones</p>
              <p className="text-2xl font-bold">{todaySales.length}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <Banknote className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Efectivo</p>
              <p className="text-2xl font-bold">${cashToday.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <CreditCard className="h-5 w-5 text-blue-600" />
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
              <SelectItem value="appointment">Citas</SelectItem>
              <SelectItem value="direct">Directas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredSales.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
            No hay ventas registradas
          </div>
        ) : (
          filteredSales
            .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
            .map((sale) => {
              const PaymentIcon = paymentIcons[sale.paymentMethod];
              return (
                <div key={sale.id} className="glass-card rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{sale.clientName}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(sale.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                        <Clock className="h-3.5 w-3.5 ml-1" />
                        <span>{sale.time}</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-success">
                      +${sale.total.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {sale.items.slice(0, 3).map((item, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {item.item.name} x{item.quantity}
                      </Badge>
                    ))}
                    {sale.items.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{sale.items.length - 3}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Badge variant={sale.type === 'appointment' ? 'default' : 'secondary'} className="text-xs">
                        {sale.type === 'appointment' ? 'Cita' : 'Directa'}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <PaymentIcon className="h-3.5 w-3.5" />
                        <span>{paymentLabels[sale.paymentMethod]}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2"
                        onClick={() => setViewingSale(sale)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2 text-destructive"
                        onClick={() => deleteSale(sale.id)}
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

      {/* Desktop Table */}
      <div className="glass-card rounded-xl overflow-hidden hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay ventas registradas
                </TableCell>
              </TableRow>
            ) : (
              filteredSales
                .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
                .map((sale) => {
                  const PaymentIcon = paymentIcons[sale.paymentMethod];
                  return (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(sale.date).toLocaleDateString('es-MX')}</span>
                          <Clock className="h-4 w-4 text-muted-foreground ml-1" />
                          <span>{sale.time}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{sale.clientName}</TableCell>
                      <TableCell>
                        <Badge variant={sale.type === 'appointment' ? 'default' : 'secondary'}>
                          {sale.type === 'appointment' ? 'Cita' : 'Directa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {sale.items.slice(0, 2).map((item, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {item.item.name} x{item.quantity}
                            </Badge>
                          ))}
                          {sale.items.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{sale.items.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{paymentLabels[sale.paymentMethod]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        +${sale.total.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8"
                            onClick={() => setViewingSale(sale)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteSale(sale.id)}
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
      <Dialog open={!!viewingSale} onOpenChange={() => setViewingSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
          </DialogHeader>
          {viewingSale && (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{viewingSale.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{new Date(viewingSale.date).toLocaleDateString('es-MX')} {viewingSale.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <Badge variant={viewingSale.type === 'appointment' ? 'default' : 'secondary'}>
                    {viewingSale.type === 'appointment' ? 'Cita' : 'Directa'}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="font-medium mb-2">Items:</p>
                <div className="space-y-2">
                  {viewingSale.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 bg-secondary/30 rounded">
                      <div className="flex items-center gap-2">
                        {item.type === 'product' ? <Package className="h-4 w-4" /> : <Scissors className="h-4 w-4" />}
                        <span>{item.item.name}</span>
                      </div>
                      <span>
                        {item.quantity} x ${'price' in item.item ? item.item.price : 0} = ${(item.quantity * ('price' in item.item ? item.item.price : 0)).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Método de pago:</span>
                  <span>{paymentLabels[viewingSale.paymentMethod]}</span>
                </div>
                {viewingSale.payments && (
                  <div className="space-y-1 text-sm">
                    {viewingSale.payments.map((p, i) => (
                      <div key={i} className="flex justify-between">
                        <span>{paymentLabels[p.method]}:</span>
                        <span>${p.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                <span className="font-medium">Total:</span>
                <span className="text-xl font-bold text-success">${viewingSale.total.toLocaleString()}</span>
              </div>

              <Button
                className="w-full gradient-bg border-0"
                onClick={() => {
                  const serviceItems = viewingSale.items.filter(i => i.type === 'service').map(i => ({
                    name: i.item.name,
                    quantity: i.quantity,
                    price: 'price' in i.item ? i.item.price : 0,
                  }));
                  const productItems = viewingSale.items.filter(i => i.type === 'product').map(i => ({
                    name: i.item.name,
                    quantity: i.quantity,
                    price: 'price' in i.item ? i.item.price : 0,
                  }));
                  setTicketData({
                    folio: viewingSale.id.replace('sl', 'V'),
                    date: new Date(`${viewingSale.date}T${viewingSale.time}`),
                    clientName: viewingSale.clientName,
                    services: serviceItems,
                    products: productItems,
                    subtotal: viewingSale.total,
                    discount: 0,
                    total: viewingSale.total,
                    paymentMethod: paymentLabels[viewingSale.paymentMethod],
                    payments: viewingSale.payments?.map(p => ({
                      method: paymentLabels[p.method],
                      amount: p.amount
                    })),
                  });
                  setViewingSale(null);
                  setShowTicket(true);
                }}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Imprimir Ticket
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ticket Printer */}
      {ticketData && (
        <TicketPrinter
          open={showTicket}
          onOpenChange={setShowTicket}
          data={ticketData}
        />
      )}
    </div>
  );
}
