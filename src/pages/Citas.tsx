import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  appointments as mockAppointments, 
  clients, 
  services, 
  stylists, 
  products,
  type Appointment, 
  type Client, 
  type Service,
  type Product,
} from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  User,
  Scissors,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  PlayCircle,
  Package,
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

const paymentLabels = {
  'cash': 'Efectivo',
  'card': 'Tarjeta',
  'transfer': 'Transferencia',
  'mixed': 'Mixto',
};

export default function Citas() {
  const { currentBranch } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    newClientName: '',
    newClientPhone: '',
    newClientEmail: '',
    stylistId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    selectedServices: [] as string[],
    selectedProducts: [] as { productId: string; quantity: number }[],
    notes: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'transfer' | 'mixed',
  });

  const filteredAppointments = appointments.filter(a => {
    const matchesBranch = a.branchId === currentBranch.id;
    const matchesSearch = 
      a.client.name.toLowerCase().includes(search.toLowerCase()) ||
      a.client.phone.includes(search);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesBranch && matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      clientId: '',
      newClientName: '',
      newClientPhone: '',
      newClientEmail: '',
      stylistId: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      selectedServices: [],
      selectedProducts: [],
      notes: '',
      paymentMethod: 'cash',
    });
    setEditingAppointment(null);
  };

  const openEditDialog = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      clientId: appointment.clientId,
      newClientName: '',
      newClientPhone: '',
      newClientEmail: '',
      stylistId: appointment.stylistId,
      date: appointment.date,
      time: appointment.time,
      selectedServices: appointment.services.map(s => s.id),
      selectedProducts: appointment.products?.map(p => ({ productId: p.product.id, quantity: p.quantity })) || [],
      notes: appointment.notes || '',
      paymentMethod: appointment.paymentMethod || 'cash',
    });
    setIsDialogOpen(true);
  };

  const calculateTotal = () => {
    const servicesTotal = formData.selectedServices.reduce((sum, sId) => {
      const service = services.find(s => s.id === sId);
      return sum + (service?.price || 0);
    }, 0);
    const productsTotal = formData.selectedProducts.reduce((sum, p) => {
      const product = products.find(pr => pr.id === p.productId);
      return sum + (product?.price || 0) * p.quantity;
    }, 0);
    return servicesTotal + productsTotal;
  };

  const handleSubmit = () => {
    const client = formData.clientId 
      ? clients.find(c => c.id === formData.clientId)!
      : { id: `c${Date.now()}`, name: formData.newClientName, phone: formData.newClientPhone, email: formData.newClientEmail };
    
    const stylist = stylists.find(s => s.id === formData.stylistId)!;
    const selectedServicesList = services.filter(s => formData.selectedServices.includes(s.id));
    const selectedProductsList = formData.selectedProducts.map(p => ({
      product: products.find(pr => pr.id === p.productId)!,
      quantity: p.quantity,
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
              date: formData.date,
              time: formData.time,
              services: selectedServicesList,
              products: selectedProductsList,
              notes: formData.notes,
              paymentMethod: formData.paymentMethod,
              total: calculateTotal(),
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
        date: formData.date,
        time: formData.time,
        services: selectedServicesList,
        products: selectedProductsList,
        status: 'scheduled',
        paymentMethod: formData.paymentMethod,
        total: calculateTotal(),
        notes: formData.notes,
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

  const toggleProduct = (productId: string) => {
    setFormData(prev => {
      const existing = prev.selectedProducts.find(p => p.productId === productId);
      if (existing) {
        return { ...prev, selectedProducts: prev.selectedProducts.filter(p => p.productId !== productId) };
      }
      return { ...prev, selectedProducts: [...prev.selectedProducts, { productId, quantity: 1 }] };
    });
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map(p => 
        p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p
      ),
    }));
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAppointment ? 'Editar Cita' : 'Nueva Cita'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <Tabs defaultValue="existing" className="w-full">
                <Label>Cliente</Label>
                <TabsList className="mt-2">
                  <TabsTrigger value="existing">Cliente Existente</TabsTrigger>
                  <TabsTrigger value="new">Nuevo Cliente</TabsTrigger>
                </TabsList>
                <TabsContent value="existing" className="mt-3">
                  <Select value={formData.clientId} onValueChange={(v) => setFormData(prev => ({ ...prev, clientId: v }))}>
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
                        value={formData.newClientName}
                        onChange={(e) => setFormData(prev => ({ ...prev, newClientName: e.target.value }))}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPhone">Teléfono</Label>
                      <Input 
                        id="newPhone"
                        value={formData.newClientPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, newClientPhone: e.target.value }))}
                        placeholder="555-0000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newEmail">Email (opcional)</Label>
                    <Input 
                      id="newEmail"
                      type="email"
                      value={formData.newClientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, newClientEmail: e.target.value }))}
                      placeholder="cliente@email.com"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Stylist, Date, Time */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Estilista</Label>
                  <Select value={formData.stylistId} onValueChange={(v) => setFormData(prev => ({ ...prev, stylistId: v }))}>
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
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Select value={formData.time} onValueChange={(v) => setFormData(prev => ({ ...prev, time: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => {
                        const hour = Math.floor(i / 2) + 8;
                        const minutes = i % 2 === 0 ? '00' : '30';
                        if (hour > 20) return null;
                        const time = `${hour.toString().padStart(2, '0')}:${minutes}`;
                        return <SelectItem key={time} value={time}>{time}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-3">
                <Label>Servicios</Label>
                <div className="grid gap-2 sm:grid-cols-2 max-h-[200px] overflow-y-auto p-1">
                  {services.filter(s => s.active).map(service => (
                    <label
                      key={service.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        formData.selectedServices.includes(service.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox
                        checked={formData.selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            selectedServices: checked
                              ? [...prev.selectedServices, service.id]
                              : prev.selectedServices.filter(id => id !== service.id),
                          }));
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.duration} min</p>
                      </div>
                      <span className="font-semibold">${service.price}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="space-y-3">
                <Label>Productos (opcional)</Label>
                <div className="grid gap-2 sm:grid-cols-2 max-h-[200px] overflow-y-auto p-1">
                  {products.filter(p => p.active && p.stock > 0).map(product => {
                    const selected = formData.selectedProducts.find(p => p.productId === product.id);
                    return (
                      <div
                        key={product.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-all',
                          selected ? 'border-primary bg-primary/10' : 'border-border'
                        )}
                      >
                        <Checkbox
                          checked={!!selected}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                        </div>
                        {selected && (
                          <Input
                            type="number"
                            min={1}
                            max={product.stock}
                            value={selected.quantity}
                            onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value))}
                            className="w-16 h-8 text-center"
                          />
                        )}
                        <span className="font-semibold">${product.price}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment & Notes */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Método de Pago</Label>
                  <Select 
                    value={formData.paymentMethod} 
                    onValueChange={(v: 'cash' | 'card' | 'transfer' | 'mixed') => setFormData(prev => ({ ...prev, paymentMethod: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Efectivo</SelectItem>
                      <SelectItem value="card">Tarjeta</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                      <SelectItem value="mixed">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total</Label>
                  <div className="h-10 px-3 flex items-center rounded-md border bg-muted font-bold text-lg">
                    ${calculateTotal().toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
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
                  disabled={(!formData.clientId && !formData.newClientName) || !formData.stylistId || formData.selectedServices.length === 0}
                >
                  {editingAppointment ? 'Guardar Cambios' : 'Crear Cita'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
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
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Estilista</TableHead>
              <TableHead>Servicios</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No hay citas que mostrar
                </TableCell>
              </TableRow>
            ) : (
              filteredAppointments
                .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
                .map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{appointment.client.name}</p>
                        <p className="text-sm text-muted-foreground">{appointment.client.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(appointment.date).toLocaleDateString('es-MX')}</span>
                        <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                        <span>{appointment.time}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: appointment.stylist.color }}
                        />
                        {appointment.stylist.name}
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
                    <TableCell className="font-semibold">
                      ${appointment.total.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('border', statusColors[appointment.status])}>
                        {statusLabels[appointment.status]}
                      </Badge>
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
