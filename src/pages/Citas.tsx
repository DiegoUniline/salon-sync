import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useSearchParams } from 'react-router-dom';
import { 
  appointments as mockAppointments, 
  clients, 
  services, 
  stylists, 
  products,
  type Appointment, 
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { OdooLineEditor, type LineItem, type ColumnConfig } from '@/components/OdooLineEditor';
import { MultiPaymentSelector, type Payment } from '@/components/MultiPaymentSelector';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Scissors,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  PlayCircle,
  Package,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

const statusLabels = {
  'scheduled': 'Agendada',
  'in-progress': 'En proceso',
  'completed': 'Completada',
  'cancelled': 'Cancelada',
};

const statusColors = {
  'scheduled': 'bg-info/20 text-info border-info/30',
  'in-progress': 'bg-warning/20 text-warning border-warning/30',
  'completed': 'bg-success/20 text-success border-success/30',
  'cancelled': 'bg-destructive/20 text-destructive border-destructive/30',
};

export default function Citas() {
  const { currentBranch } = useApp();
  const [searchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Check URL params on mount
  const urlParamDate = searchParams.get('date');
  const urlParamTime = searchParams.get('time');
  const urlParamStylist = searchParams.get('stylist');
  const urlParamDuration = searchParams.get('duration');
  const hasUrlParams = !!(urlParamDate || urlParamTime || urlParamStylist);

  // Form state - initialize from URL params if present
  const [clientTab, setClientTab] = useState<'existing' | 'new'>('existing');
  const [clientId, setClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [stylistId, setStylistId] = useState(urlParamStylist || '');
  const [date, setDate] = useState(urlParamDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(urlParamTime || '09:00');
  const [notes, setNotes] = useState('');
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [preselectedDuration, setPreselectedDuration] = useState<number | null>(
    urlParamDuration ? parseInt(urlParamDuration) : null
  );
  
  // Dialog state - open automatically if URL params present
  const [isDialogOpen, setIsDialogOpen] = useState(hasUrlParams);
  
  // Odoo-style lines
  const [serviceLines, setServiceLines] = useState<LineItem[]>([]);
  const [productLines, setProductLines] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([
    { id: 'pay-1', method: 'cash', amount: 0 }
  ]);

  // Clear URL params after mount
  useEffect(() => {
    if (hasUrlParams) {
      window.history.replaceState({}, '', '/citas');
    }
  }, []);

  const filteredAppointments = appointments.filter(a => {
    const matchesBranch = a.branchId === currentBranch.id;
    const matchesSearch = 
      a.client.name.toLowerCase().includes(search.toLowerCase()) ||
      a.client.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesBranch && matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setClientTab('existing');
    setClientId('');
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setStylistId('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('09:00');
    setNotes('');
    setGeneralDiscount(0);
    setPreselectedDuration(null);
    setServiceLines([]);
    setProductLines([]);
    setPayments([{ id: 'pay-1', method: 'cash', amount: 0 }]);
    setEditingAppointment(null);
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setClientTab('existing');
    setClientId(appointment.clientId);
    setStylistId(appointment.stylistId);
    setDate(appointment.date);
    setTime(appointment.time);
    setNotes(appointment.notes || '');
    setGeneralDiscount(0);
    
    // Convert services to lines with discount
    setServiceLines(appointment.services.map(s => ({
      id: `sl-${s.id}-${Date.now()}`,
      serviceId: s.id,
      serviceName: s.name,
      duration: s.duration,
      price: s.price,
      discount: 0,
      subtotal: s.price,
    })));
    
    // Convert products to lines with discount
    setProductLines(appointment.products?.map(p => ({
      id: `pl-${p.product.id}-${Date.now()}`,
      productId: p.product.id,
      productName: p.product.name,
      quantity: p.quantity,
      price: p.product.price,
      discount: 0,
      subtotal: p.quantity * p.product.price,
    })) || []);
    
    setPayments([{ id: 'pay-1', method: 'cash', amount: appointment.total }]);
    setIsDialogOpen(true);
  };

  // Calculate totals with discounts
  const servicesSubtotal = serviceLines.reduce((sum, line) => sum + (line.price || 0), 0);
  const servicesDiscount = serviceLines.reduce((sum, line) => {
    const price = line.price || 0;
    const discount = line.discount || 0;
    return sum + (price * discount / 100);
  }, 0);
  const servicesTotal = servicesSubtotal - servicesDiscount;

  const productsSubtotal = productLines.reduce((sum, line) => sum + (line.subtotal || 0), 0);
  const productsDiscount = productLines.reduce((sum, line) => {
    const subtotal = line.subtotal || 0;
    const discount = line.discount || 0;
    return sum + (subtotal * discount / 100);
  }, 0);
  const productsTotal = productsSubtotal - productsDiscount;

  const subtotal = servicesTotal + productsTotal;
  const generalDiscountAmount = subtotal * generalDiscount / 100;
  const total = subtotal - generalDiscountAmount;
  const totalDuration = serviceLines.reduce((sum, line) => sum + (line.duration || 0), 0);

  // Column configs with discount
  const serviceColumns: ColumnConfig[] = [
    {
      key: 'serviceName',
      label: 'Servicio',
      type: 'search',
      placeholder: 'Buscar servicio...',
      width: 'flex-[2]',
      searchItems: services.filter(s => s.active).map(s => ({
        id: s.id,
        label: s.name,
        subLabel: `${s.duration} min | $${s.price}`,
        data: s,
      })),
      onSelect: (item, lineId) => {
        setServiceLines(prev => prev.map(line =>
          line.id === lineId 
            ? { 
                ...line, 
                serviceId: item.id, 
                serviceName: item.label, 
                duration: item.data.duration, 
                price: item.data.price,
                subtotal: item.data.price * (1 - (line.discount || 0) / 100)
              }
            : line
        ));
      },
    },
    {
      key: 'duration',
      label: 'Duración',
      type: 'number',
      width: 'w-20',
      readOnly: true,
      format: (v) => `${v || 0} min`,
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'number',
      width: 'w-24',
      readOnly: true,
      format: (v) => `$${(v || 0).toLocaleString()}`,
    },
    {
      key: 'discount',
      label: 'Desc. %',
      type: 'number',
      width: 'w-20',
      min: 0,
      max: 100,
      placeholder: '0',
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      type: 'number',
      width: 'w-24',
      readOnly: true,
      format: (v) => `$${(v || 0).toLocaleString()}`,
    },
  ];

  const productColumns: ColumnConfig[] = [
    {
      key: 'productName',
      label: 'Producto',
      type: 'search',
      placeholder: 'Buscar producto...',
      width: 'flex-[2]',
      searchItems: products.filter(p => p.active && p.stock > 0).map(p => ({
        id: p.id,
        label: p.name,
        subLabel: `Stock: ${p.stock} | $${p.price}`,
        data: p,
      })),
      onSelect: (item, lineId) => {
        setProductLines(prev => prev.map(line =>
          line.id === lineId 
            ? { 
                ...line, 
                productId: item.id, 
                productName: item.label, 
                price: item.data.price, 
                quantity: 1, 
                subtotal: item.data.price 
              }
            : line
        ));
      },
    },
    {
      key: 'quantity',
      label: 'Cant.',
      type: 'number',
      width: 'w-16',
      min: 1,
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'number',
      width: 'w-24',
      readOnly: true,
      format: (v) => `$${(v || 0).toLocaleString()}`,
    },
    {
      key: 'discount',
      label: 'Desc. %',
      type: 'number',
      width: 'w-20',
      min: 0,
      max: 100,
      placeholder: '0',
    },
    {
      key: 'subtotal',
      label: 'Subtotal',
      type: 'number',
      width: 'w-24',
      readOnly: true,
      format: (v) => `$${(v || 0).toLocaleString()}`,
    },
  ];

  const addServiceLine = () => {
    setServiceLines(prev => [
      ...prev,
      { id: `sl-${Date.now()}`, serviceId: '', serviceName: '', duration: 0, price: 0, discount: 0, subtotal: 0 }
    ]);
  };

  const updateServiceLine = (lineId: string, key: string, value: any) => {
    setServiceLines(prev => prev.map(line => {
      if (line.id !== lineId) return line;
      const updated = { ...line, [key]: value };
      // Recalculate subtotal when discount changes
      if (key === 'discount') {
        updated.subtotal = (updated.price || 0) * (1 - (updated.discount || 0) / 100);
      }
      return updated;
    }));
  };

  const removeServiceLine = (lineId: string) => {
    setServiceLines(prev => prev.filter(line => line.id !== lineId));
  };

  const addProductLine = () => {
    setProductLines(prev => [
      ...prev,
      { id: `pl-${Date.now()}`, productId: '', productName: '', quantity: 1, price: 0, discount: 0, subtotal: 0 }
    ]);
  };

  const updateProductLine = (lineId: string, key: string, value: any) => {
    setProductLines(prev => prev.map(line => {
      if (line.id !== lineId) return line;
      const updated = { ...line, [key]: value };
      // Recalculate subtotal when quantity or discount changes
      const baseSubtotal = (updated.quantity || 0) * (updated.price || 0);
      updated.subtotal = baseSubtotal * (1 - (updated.discount || 0) / 100);
      return updated;
    }));
  };

  const removeProductLine = (lineId: string) => {
    setProductLines(prev => prev.filter(line => line.id !== lineId));
  };

  const handleSubmit = () => {
    const client = clientTab === 'existing' && clientId
      ? clients.find(c => c.id === clientId)!
      : { id: `c${Date.now()}`, name: newClientName, phone: newClientPhone, email: newClientEmail };
    
    if (!client.name) {
      toast.error('Selecciona o ingresa un cliente');
      return;
    }

    if (!stylistId) {
      toast.error('Selecciona un estilista');
      return;
    }

    const validServices = serviceLines.filter(l => l.serviceId);
    if (validServices.length === 0) {
      toast.error('Agrega al menos un servicio');
      return;
    }

    const stylist = stylists.find(s => s.id === stylistId)!;
    const selectedServices = validServices.map(line => services.find(s => s.id === line.serviceId)!);
    const selectedProducts = productLines.filter(l => l.productId).map(line => ({
      product: products.find(p => p.id === line.productId)!,
      quantity: line.quantity,
    }));

    if (editingAppointment) {
      setAppointments(prev => prev.map(a => 
        a.id === editingAppointment.id
          ? {
              ...a,
              client,
              clientId: client.id,
              stylist,
              stylistId: stylist.id,
              date,
              time,
              services: selectedServices,
              products: selectedProducts,
              notes,
              paymentMethod: payments.length > 1 ? 'mixed' : payments[0].method,
              total,
            }
          : a
      ));
      toast.success('Cita actualizada correctamente');
    } else {
      const newAppointment: Appointment = {
        id: `a${Date.now()}`,
        clientId: client.id,
        client,
        stylistId: stylist.id,
        stylist,
        branchId: currentBranch.id,
        date,
        time,
        services: selectedServices,
        products: selectedProducts,
        status: 'scheduled',
        paymentMethod: payments.length > 1 ? 'mixed' : payments[0].method,
        total,
        notes,
      };
      setAppointments(prev => [...prev, newAppointment]);
      toast.success('Cita creada correctamente');
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const updateStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => 
      a.id === id ? { ...a, status } : a
    ));
    toast.success(`Cita marcada como ${statusLabels[status].toLowerCase()}`);
  };

  const deleteAppointment = (id: string) => {
    setAppointments(prev => prev.filter(a => a.id !== id));
    toast.success('Cita eliminada');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Citas</h1>
          <p className="text-muted-foreground">Gestiona todas las citas de la sucursal</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-bg border-0">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAppointment ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Client Selection */}
              <Tabs value={clientTab} onValueChange={(v) => setClientTab(v as 'existing' | 'new')} className="w-full">
                <Label className="text-base font-semibold">Cliente</Label>
                <TabsList className="mt-2">
                  <TabsTrigger value="existing">Cliente Existente</TabsTrigger>
                  <TabsTrigger value="new">Nuevo Cliente</TabsTrigger>
                </TabsList>
                <TabsContent value="existing" className="mt-3">
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {client.name} - {client.phone}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>
                <TabsContent value="new" className="mt-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newName">Nombre</Label>
                      <Input 
                        id="newName"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPhone">Teléfono</Label>
                      <Input 
                        id="newPhone"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="555-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Email (opcional)</Label>
                    <Input 
                      id="newEmail"
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="cliente@email.com"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Stylist, Date, Time */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Estilista</Label>
                  <Select value={stylistId} onValueChange={setStylistId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {stylists.filter(s => s.role !== 'receptionist').map(stylist => (
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
                  <Label>Fecha</Label>
                  <Input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 26 }, (_, i) => {
                        const hour = Math.floor(i / 2) + 8;
                        const minutes = i % 2 === 0 ? '00' : '30';
                        if (hour > 20) return null;
                        const t = `${hour.toString().padStart(2, '0')}:${minutes}`;
                        return <SelectItem key={t} value={t}>{t}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Services - Odoo style with discount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Servicios
                  </Label>
                  <div className="flex items-center gap-2">
                    {totalDuration > 0 && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        {totalDuration} min
                      </Badge>
                    )}
                    {servicesDiscount > 0 && (
                      <Badge variant="outline" className="text-success">
                        <Percent className="h-3 w-3 mr-1" />
                        -${servicesDiscount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tab para moverte entre campos editables. Al final, Tab agrega nueva línea.
                </p>
                <OdooLineEditor
                  lines={serviceLines}
                  columns={serviceColumns}
                  onUpdateLine={updateServiceLine}
                  onRemoveLine={removeServiceLine}
                  onAddLine={addServiceLine}
                  showTotal
                  totalLabel="Subtotal Servicios"
                  totalValue={servicesTotal}
                  emptyMessage="Haz clic o presiona Tab para agregar servicios"
                />
              </div>

              {/* Products - Odoo style with discount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Productos (opcional)
                  </Label>
                  {productsDiscount > 0 && (
                    <Badge variant="outline" className="text-success">
                      <Percent className="h-3 w-3 mr-1" />
                      -${productsDiscount.toLocaleString()}
                    </Badge>
                  )}
                </div>
                <OdooLineEditor
                  lines={productLines}
                  columns={productColumns}
                  onUpdateLine={updateProductLine}
                  onRemoveLine={removeProductLine}
                  onAddLine={addProductLine}
                  showTotal
                  totalLabel="Subtotal Productos"
                  totalValue={productsTotal}
                  emptyMessage="Haz clic para agregar productos"
                />
              </div>

              {/* General Discount */}
              <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Descuento General
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={generalDiscount}
                      onChange={(e) => setGeneralDiscount(parseFloat(e.target.value) || 0)}
                      className="w-20 text-right"
                      placeholder="0"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                {generalDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento aplicado:</span>
                    <span className="text-success font-medium">-${generalDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
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

              {/* Grand Total */}
              <div className="p-4 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal servicios:</span>
                    <span>${servicesTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal productos:</span>
                    <span>${productsTotal.toLocaleString()}</span>
                  </div>
                  {generalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Descuento general ({generalDiscount}%):</span>
                      <span>-${generalDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-primary/30">
                    <span className="text-lg font-semibold">Total de la Cita</span>
                    <span className="text-3xl font-bold">${total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-bg border-0"
                  onClick={handleSubmit}
                >
                  {editingAppointment ? 'Actualizar Cita' : 'Crear Cita'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="scheduled">Agendadas</SelectItem>
              <SelectItem value="in-progress">En proceso</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estilista</TableHead>
              <TableHead>Servicios</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay citas registradas
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments
                .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
                .map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{new Date(appointment.date).toLocaleDateString('es-MX')}</p>
                          <p className="text-sm text-muted-foreground">{appointment.time}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.client.name}</p>
                        <p className="text-sm text-muted-foreground">{appointment.client.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: appointment.stylist.color }}
                        >
                          {appointment.stylist.name.charAt(0)}
                        </div>
                        <span>{appointment.stylist.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {appointment.services.slice(0, 2).map(s => (
                          <Badge key={s.id} variant="secondary" className="text-xs">
                            {s.name}
                          </Badge>
                        ))}
                        {appointment.services.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{appointment.services.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('border', statusColors[appointment.status])}>
                        {statusLabels[appointment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${appointment.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {appointment.status === 'scheduled' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-warning"
                            onClick={() => updateStatus(appointment.id, 'in-progress')}
                            title="Iniciar"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {appointment.status === 'in-progress' && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-success"
                            onClick={() => updateStatus(appointment.id, 'completed')}
                            title="Completar"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {(appointment.status === 'scheduled' || appointment.status === 'in-progress') && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => updateStatus(appointment.id, 'cancelled')}
                            title="Cancelar"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(appointment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteAppointment(appointment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
