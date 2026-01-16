import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import api from '@/lib/api';
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
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  active: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  active: boolean;
}

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Stylist {
  id: string;
  name: string;
  color: string;
  role: string;
}

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: string;
  initialTime?: string;
  initialStylistId?: string;
  initialDuration?: number;
  onSave?: () => void;
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  initialDate,
  initialTime,
  initialStylistId,
  initialDuration,
  onSave,
}: AppointmentFormDialogProps) {
  const { currentBranch } = useApp();
  
  // Data from API
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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

  // Load data from API when dialog opens
  useEffect(() => {
    if (open) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [clientsData, servicesData, productsData, usersData] = await Promise.all([
            api.clients.getAll(),
            api.services.getAll({ active: true }),
            api.products.getAll({ active: true }),
            api.users.getAll(),
          ]);
          setClients(clientsData);
          setServices(servicesData);
          setProducts(productsData);
          setStylists(usersData.filter((u: any) => u.role !== 'Recepcionista'));
        } catch (error) {
          console.error('Error loading data:', error);
          toast.error('Error al cargar datos');
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }
  }, [open]);

  // Initialize form when dialog opens
  useEffect(() => {
    if (open && !loading) {
      setStylistId(initialStylistId || '');
      setDate(initialDate || new Date().toISOString().split('T')[0]);
      setTime(initialTime || '09:00');
    }
  }, [open, loading, initialDate, initialTime, initialStylistId]);

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

  const handleSubmit = async () => {
    let finalClientId = clientId;

    // Create new client if needed
    if (clientTab === 'new') {
      if (!newClientName) {
        toast.error('Ingresa el nombre del cliente');
        return;
      }
      try {
        setSaving(true);
        const newClient = await api.clients.create({
          name: newClientName,
          phone: newClientPhone,
          email: newClientEmail,
        });
        finalClientId = newClient.id;
        setClients(prev => [...prev, newClient]);
      } catch (error) {
        toast.error('Error al crear cliente');
        setSaving(false);
        return;
      }
    }

    if (!finalClientId) {
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

    const normalizeAmount = (v: number | string) => Number(parseFloat(String(v)) || 0);
    const totalPaid = payments.reduce((sum, p) => sum + normalizeAmount(p.amount), 0);
    const round = (n: number) => Math.round(n * 100) / 100;

    if (round(totalPaid) !== round(total)) {
      toast.error('La suma de los pagos no coincide con el total');
      return;
    }

    const appointmentData = {
      client_id: finalClientId,
      stylist_id: stylistId,
      branch_id: currentBranch?.id,
      date,
      time,
      duration: totalDuration,
      services: validServices.map(l => ({
        service_id: l.serviceId,
        price: l.price,
        discount: l.discount || 0,
      })),
      products: productLines.filter(l => l.productId).map(l => ({
        product_id: l.productId,
        quantity: l.quantity,
        price: l.price,
        discount: l.discount || 0,
      })),
      payments: payments.map(p => ({
        method: p.method,
        amount: normalizeAmount(p.amount),
        reference: p.reference || null,
      })),
      subtotal,
      discount: generalDiscountAmount,
      discount_percent: generalDiscount,
      total,
      notes,
    };

    try {
      setSaving(true);
      await api.appointments.create(appointmentData);
      toast.success('Cita creada correctamente');
      onOpenChange(false);
      resetForm();
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving appointment:', error);
      toast.error('Error al guardar la cita');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => { 
      onOpenChange(openState); 
      if (!openState) resetForm(); 
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Nueva Cita
            {initialDuration && (
              <Badge variant="secondary" className="ml-2">
                <Clock className="h-3 w-3 mr-1" />
                {initialDuration} min reservados
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
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
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <Label>Estilista</Label>
                <Select value={stylistId} onValueChange={setStylistId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {stylists.map(stylist => (
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
                <Input 
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duración</Label>
                <div className="h-10 px-3 flex items-center bg-muted rounded-md text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  {totalDuration} min
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Servicios
                </Label>
              </div>
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

            {/* Products */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos (opcional)
                </Label>
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
                emptyMessage="Agrega productos si aplica"
              />
            </div>

            {/* General Discount */}
            <div className="glass-card rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <Label>Descuento General (%)</Label>
              </div>
              <div className="flex items-center gap-4">
                <Input 
                  type="number"
                  min={0}
                  max={100}
                  value={generalDiscount}
                  onChange={(e) => setGeneralDiscount(Number(e.target.value))}
                  className="w-24"
                />
                <div className="flex-1 text-right">
                  <span className="text-muted-foreground">Subtotal: </span>
                  <span className="font-medium">${subtotal.toLocaleString()}</span>
                  {generalDiscount > 0 && (
                    <span className="text-destructive ml-2">
                      -${generalDiscountAmount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
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
                placeholder="Instrucciones especiales, preferencias del cliente..."
                rows={2}
              />
            </div>

            {/* Total and Submit */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-2xl font-bold">
                Total: ${total.toLocaleString()}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }} disabled={saving}>
                  Cancelar
                </Button>
                <Button 
                  className="gradient-bg border-0"
                  onClick={handleSubmit}
                  disabled={saving || serviceLines.filter(l => l.serviceId).length === 0}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Crear Cita'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}