import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { 
  clients, 
  services, 
  stylists, 
  products,
  type Appointment, 
} from '@/lib/mockData';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { OdooLineEditor, type LineItem, type ColumnConfig } from '@/components/OdooLineEditor';
import { MultiPaymentSelector, type Payment } from '@/components/MultiPaymentSelector';
import {
  Clock,
  User,
  Scissors,
  Package,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string;
  initialTime?: string;
  initialStylistId?: string;
  initialDuration?: number;
  editingAppointment?: Appointment | null;
  onSave?: (appointment: Appointment) => void;
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  initialDate,
  initialTime,
  initialStylistId,
  initialDuration,
  editingAppointment,
  onSave,
}: AppointmentFormDialogProps) {
  const { currentBranch } = useApp();
  
  // Form state
  const [clientTab, setClientTab] = useState<'existing' | 'new'>('existing');
  const [clientId, setClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [stylistId, setStylistId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [generalDiscount, setGeneralDiscount] = useState(0);
  
  // Odoo-style lines
  const [serviceLines, setServiceLines] = useState<LineItem[]>([]);
  const [productLines, setProductLines] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([
    { id: 'pay-1', method: 'cash', amount: 0 }
  ]);

  // Initialize form when dialog opens or initial values change
  useEffect(() => {
    if (open) {
      if (editingAppointment) {
        // Editing mode
        setClientTab('existing');
        setClientId(editingAppointment.clientId);
        setStylistId(editingAppointment.stylistId);
        setDate(editingAppointment.date);
        setTime(editingAppointment.time);
        setNotes(editingAppointment.notes || '');
        setGeneralDiscount(0);
        setServiceLines(editingAppointment.services.map(s => ({
          id: `sl-${s.id}-${Date.now()}`,
          serviceId: s.id,
          serviceName: s.name,
          duration: s.duration,
          price: s.price,
          discount: 0,
          subtotal: s.price,
        })));
        setProductLines(editingAppointment.products?.map(p => ({
          id: `pl-${p.product.id}-${Date.now()}`,
          productId: p.product.id,
          productName: p.product.name,
          quantity: p.quantity,
          price: p.product.price,
          discount: 0,
          subtotal: p.quantity * p.product.price,
        })) || []);
        setPayments([{ id: 'pay-1', method: 'cash', amount: editingAppointment.total }]);
      } else {
        // New appointment mode
        setClientTab('existing');
        setClientId('');
        setNewClientName('');
        setNewClientPhone('');
        setNewClientEmail('');
        setStylistId(initialStylistId || '');
        setDate(initialDate || new Date().toISOString().split('T')[0]);
        setTime(initialTime || '09:00');
        setNotes('');
        setGeneralDiscount(0);
        setServiceLines([]);
        setProductLines([]);
        setPayments([{ id: 'pay-1', method: 'cash', amount: 0 }]);
      }
    }
  }, [open, initialDate, initialTime, initialStylistId, editingAppointment]);

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
    setServiceLines([]);
    setProductLines([]);
    setPayments([{ id: 'pay-1', method: 'cash', amount: 0 }]);
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

    const newAppointment: Appointment = {
      id: editingAppointment?.id || `a${Date.now()}`,
      clientId: client.id,
      client,
      stylistId: stylist.id,
      stylist,
      branchId: currentBranch.id,
      date,
      time,
      services: selectedServices,
      products: selectedProducts,
      status: editingAppointment?.status || 'scheduled',
      paymentMethod: payments.length > 1 ? 'mixed' : payments[0].method,
      total,
      notes,
    };

    if (onSave) {
      onSave(newAppointment);
    }

    toast.success(editingAppointment ? 'Cita actualizada correctamente' : 'Cita creada correctamente');
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => { 
      onOpenChange(openState); 
      if (!openState) resetForm(); 
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
            {initialDuration && !editingAppointment && (
              <Badge variant="secondary" className="ml-2">
                <Clock className="h-3 w-3 mr-1" />
                {initialDuration} min reservados
              </Badge>
            )}
          </DialogTitle>
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
            <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>
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
  );
}
