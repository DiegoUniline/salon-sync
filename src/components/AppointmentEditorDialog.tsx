import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  OdooLineEditor,
  type LineItem,
  type ColumnConfig,
} from "@/components/OdooLineEditor";
import {
  MultiPaymentSelector,
  type Payment,
} from "@/components/MultiPaymentSelector";
import {
  Clock,
  User,
  Scissors,
  Package,
  Percent,
  Phone,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

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

interface AppointmentPayment {
  id: string;
  method: "cash" | "card" | "transfer";
  amount: number;
  reference?: string;
}

interface AppointmentService {
  id: string;
  service_id: string;
  name: string;
  price: number;
  discount: number;
  duration: number;
}

interface AppointmentProduct {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  client_id: string;
  client_name: string;
  client_phone: string;
  stylist_id: string;
  branch_id: string;
  services?: AppointmentService[];
  products?: AppointmentProduct[];
  payments?: AppointmentPayment[];
  subtotal?: number;
  discount?: number;
  discount_percent?: number;
  total: number;
  notes?: string;
}

interface AppointmentEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  initialDate?: string;
  initialTime?: string;
  initialStylistId?: string;
  onSave?: () => void;
}

const statusLabels = {
  scheduled: "Agendada",
  "in-progress": "En proceso",
  completed: "Completada",
  cancelled: "Cancelada",
};

const statusColors = {
  scheduled: "bg-info/20 text-info border-info/30",
  "in-progress": "bg-warning/20 text-warning border-warning/30",
  completed: "bg-success/20 text-success border-success/30",
  cancelled: "bg-destructive/20 text-destructive border-destructive/30",
};

export function AppointmentEditorDialog({
  open,
  onOpenChange,
  appointment,
  initialDate,
  initialTime,
  initialStylistId,
  onSave,
}: AppointmentEditorDialogProps) {
  const { currentBranch } = useApp();

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clientTab, setClientTab] = useState<"existing" | "new">("existing");
  const [clientId, setClientId] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [generalDiscount, setGeneralDiscount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState<Appointment["status"]>("scheduled");

  const [serviceLines, setServiceLines] = useState<LineItem[]>([]);
  const [productLines, setProductLines] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([
    { id: "pay-1", method: "cash", amount: 0 },
  ]);

  // Load master data
  useEffect(() => {
    if (!open) return;
    
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
        setStylists((usersData as Stylist[]).filter((u) => u.role !== "receptionist"));
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    
    if (appointment) {
      setClientTab("existing");
      setClientId(appointment.client_id);
      setStylistId(appointment.stylist_id);
      setDate(appointment.date.split("T")[0]);
      setTime((appointment.time || "09:00").slice(0, 5));
      setNotes(appointment.notes || "");
      setGeneralDiscount(Number(appointment.discount_percent ?? 0));
      setCurrentStatus(appointment.status);

      setServiceLines(
        appointment.services?.map((s) => ({
          id: `sl-${s.id}`,
          serviceId: s.service_id,
          serviceName: s.name,
          duration: s.duration,
          price: Number(s.price),
          discount: s.discount ?? 0,
          subtotal: Number(s.price) * (1 - (s.discount ?? 0) / 100),
        })) || []
      );

      setProductLines(
        appointment.products?.filter((p) => p && p.product_id).map((p) => ({
          id: `pl-${p.product_id}-${Date.now()}`,
          productId: p.product_id,
          productName: p.name,
          quantity: p.quantity,
          price: Number(p.price),
          discount: p.discount || 0,
          subtotal: p.quantity * Number(p.price) * (1 - (p.discount || 0) / 100),
        })) || []
      );

      if (appointment.payments?.length) {
        setPayments(
          appointment.payments.map((p, i) => ({
            id: p.id || `pay-${i}`,
            method: p.method,
            amount: Number(p.amount),
            reference: p.reference || "",
          }))
        );
      } else {
        setPayments([{ id: "pay-1", method: "cash", amount: Number(appointment.total) }]);
      }
    } else {
      // New appointment
      resetForm();
      if (initialDate) setDate(initialDate);
      if (initialTime) setTime(initialTime);
      if (initialStylistId) setStylistId(initialStylistId);
    }
  }, [open, appointment, initialDate, initialTime, initialStylistId]);

  const resetForm = () => {
    setClientTab("existing");
    setClientId("");
    setNewClientName("");
    setNewClientPhone("");
    setNewClientEmail("");
    setStylistId("");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("09:00");
    setNotes("");
    setGeneralDiscount(0);
    setCurrentStatus("scheduled");
    setServiceLines([]);
    setProductLines([]);
    setPayments([{ id: "pay-1", method: "cash", amount: 0 }]);
  };

  // Calculations
  const servicesSubtotal = serviceLines.reduce((sum, line) => sum + Number(line.subtotal || 0), 0);
  const productsTotal = productLines.reduce((sum, line) => sum + Number(line.subtotal || 0), 0);
  const subtotal = servicesSubtotal + productsTotal;
  const generalDiscountAmount = (subtotal * generalDiscount) / 100;
  const total = subtotal - generalDiscountAmount;
  const totalDuration = serviceLines.reduce((sum, line) => sum + (line.duration || 0), 0);

  const serviceColumns: ColumnConfig[] = [
    {
      key: "serviceName",
      label: "Servicio",
      type: "search",
      placeholder: "Buscar servicio...",
      width: "flex-[2]",
      searchItems: services.filter((s) => s.active).map((s) => ({
        id: s.id,
        label: s.name,
        subLabel: `${s.duration} min | $${s.price}`,
        data: s,
      })),
      onSelect: (item, lineId) => {
        setServiceLines((prev) =>
          prev.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  serviceId: item.id,
                  serviceName: item.label,
                  duration: item.data.duration,
                  price: item.data.price,
                  subtotal: item.data.price * (1 - (line.discount || 0) / 100),
                }
              : line
          )
        );
      },
    },
    { key: "duration", label: "Min", type: "number", width: "w-16", readOnly: true, format: (v) => `${v || 0}` },
    { key: "price", label: "Precio", type: "number", width: "w-20", readOnly: true, format: (v) => `$${(v || 0).toLocaleString()}` },
    { key: "discount", label: "%", type: "number", width: "w-14", min: 0, max: 100, placeholder: "0" },
    { key: "subtotal", label: "Total", type: "number", width: "w-20", readOnly: true, format: (v) => `$${(v || 0).toLocaleString()}` },
  ];

  const productColumns: ColumnConfig[] = [
    {
      key: "productName",
      label: "Producto",
      type: "search",
      placeholder: "Buscar producto...",
      width: "flex-[2]",
      searchItems: products.filter((p) => p.active && p.stock > 0).map((p) => ({
        id: p.id,
        label: p.name,
        subLabel: `Stock: ${p.stock} | $${p.price}`,
        data: p,
      })),
      onSelect: (item, lineId) => {
        setProductLines((prev) =>
          prev.map((line) =>
            line.id === lineId
              ? {
                  ...line,
                  productId: item.id,
                  productName: item.label,
                  price: item.data.price,
                  quantity: 1,
                  subtotal: item.data.price,
                }
              : line
          )
        );
      },
    },
    { key: "quantity", label: "Cant.", type: "number", width: "w-14", min: 1 },
    { key: "price", label: "Precio", type: "number", width: "w-20", readOnly: true, format: (v) => `$${(v || 0).toLocaleString()}` },
    { key: "discount", label: "%", type: "number", width: "w-14", min: 0, max: 100, placeholder: "0" },
    { key: "subtotal", label: "Total", type: "number", width: "w-20", readOnly: true, format: (v) => `$${(v || 0).toLocaleString()}` },
  ];

  const addServiceLine = () => {
    setServiceLines((prev) => [
      ...prev,
      { id: `sl-${Date.now()}`, serviceId: "", serviceName: "", duration: 0, price: 0, discount: 0, subtotal: 0 },
    ]);
  };

  const updateServiceLine = (lineId: string, key: keyof LineItem, value: string | number) => {
    setServiceLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        const updated = { ...line, [key]: value };
        if (key === "discount") {
          updated.subtotal = (updated.price || 0) * (1 - (updated.discount || 0) / 100);
        }
        return updated;
      })
    );
  };

  const removeServiceLine = (lineId: string) => {
    setServiceLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  const addProductLine = () => {
    setProductLines((prev) => [
      ...prev,
      { id: `pl-${Date.now()}`, productId: "", productName: "", quantity: 1, price: 0, discount: 0, subtotal: 0 },
    ]);
  };

  const updateProductLine = (lineId: string, key: keyof LineItem, value: string | number) => {
    setProductLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        const updated = { ...line, [key]: value };
        const baseSubtotal = (updated.quantity || 0) * (updated.price || 0);
        updated.subtotal = baseSubtotal * (1 - (updated.discount || 0) / 100);
        return updated;
      })
    );
  };

  const removeProductLine = (lineId: string) => {
    setProductLines((prev) => prev.filter((line) => line.id !== lineId));
  };

  const handleSubmit = async () => {
    let finalClientId = clientId;

    if (clientTab === "new") {
      if (!newClientName) {
        toast.error("Ingresa el nombre del cliente");
        return;
      }
      try {
        const newClient = await api.clients.create({
          name: newClientName,
          phone: newClientPhone,
          email: newClientEmail,
        });
        finalClientId = newClient.id;
        setClients((prev) => [...prev, newClient]);
      } catch (error) {
        toast.error("Error al crear cliente");
        return;
      }
    }

    if (!finalClientId) {
      toast.error("Selecciona o ingresa un cliente");
      return;
    }

    if (!stylistId) {
      toast.error("Selecciona un estilista");
      return;
    }

    const validServices = serviceLines.filter((l) => l.serviceId);
    if (validServices.length === 0) {
      toast.error("Agrega al menos un servicio");
      return;
    }

    const normalizeAmount = (v: number | string) => Number(parseFloat(String(v)) || 0);
    const totalPaid = payments.reduce((sum, p) => sum + normalizeAmount(p.amount), 0);
    const round = (n: number) => Math.round(n * 100) / 100;

    if (round(totalPaid) !== round(total)) {
      toast.error("La suma de los pagos no coincide con el total");
      return;
    }

    const appointmentData = {
      client_id: finalClientId,
      stylist_id: stylistId,
      branch_id: currentBranch?.id,
      date,
      time,
      duration: totalDuration,
      services: validServices.map((l) => ({
        service_id: l.serviceId,
        price: l.price,
        discount: l.discount || 0,
      })),
      products: productLines.filter((l) => l.productId).map((l) => ({
        product_id: l.productId,
        quantity: l.quantity,
        price: l.price,
        discount: l.discount || 0,
      })),
      payments: payments.map((p) => ({
        method: p.method,
        amount: normalizeAmount(p.amount),
        reference: p.reference || null,
      })),
      subtotal,
      discount: generalDiscountAmount,
      discount_percent: generalDiscount,
      total,
    };

    setSaving(true);
    try {
      if (appointment) {
        await api.appointments.update(appointment.id, appointmentData);
        toast.success("Cita actualizada correctamente");
      } else {
        await api.appointments.create(appointmentData);
        toast.success("Cita creada correctamente");
      }
      onOpenChange(false);
      onSave?.();
    } catch (error) {
      toast.error("Error al guardar la cita");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status: Appointment["status"]) => {
    if (!appointment) return;
    try {
      await api.appointments.updateStatus(appointment.id, status);
      setCurrentStatus(status);
      toast.success(`Cita marcada como ${statusLabels[status].toLowerCase()}`);
      onSave?.();
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const getStylistColor = (id: string) => stylists.find((s) => s.id === id)?.color || "#3B82F6";
  const getStylistName = (id: string) => stylists.find((s) => s.id === id)?.name || "Sin asignar";
  const getClientName = () => {
    if (clientTab === "new") return newClientName || "Nuevo cliente";
    return clients.find((c) => c.id === clientId)?.name || "Seleccionar cliente";
  };
  const getClientPhone = () => {
    if (clientTab === "new") return newClientPhone;
    return clients.find((c) => c.id === clientId)?.phone || "";
  };

  if (loading && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[95vh]">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-[90vh]">
          {/* Left Side - Form */}
          <div className="flex-1 flex flex-col min-w-0 border-r">
            <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
              <DialogTitle>{appointment ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-5">
                {/* Client Selection */}
                <Tabs value={clientTab} onValueChange={(v) => setClientTab(v as "existing" | "new")} className="w-full">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Cliente</Label>
                    <TabsList className="h-8">
                      <TabsTrigger value="existing" className="text-xs px-3 h-7">Existente</TabsTrigger>
                      <TabsTrigger value="new" className="text-xs px-3 h-7">Nuevo</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="existing" className="mt-2">
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              {client.name} - {client.phone}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TabsContent>
                  <TabsContent value="new" className="mt-2 space-y-2">
                    <div className="grid gap-2 grid-cols-2">
                      <Input
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Nombre"
                        className="h-9"
                      />
                      <Input
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="Teléfono"
                        className="h-9"
                      />
                    </div>
                    <Input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="Email (opcional)"
                      className="h-9"
                    />
                  </TabsContent>
                </Tabs>

                {/* Stylist, Date, Time */}
                <div className="grid gap-3 grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Estilista</Label>
                    <Select value={stylistId} onValueChange={setStylistId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {stylists.map((stylist) => (
                          <SelectItem key={stylist.id} value={stylist.id}>
                            <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stylist.color }} />
                              {stylist.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fecha</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hora</Label>
                    <Select value={time} onValueChange={setTime}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 26 }, (_, i) => {
                          const hour = Math.floor(i / 2) + 8;
                          const minutes = i % 2 === 0 ? "00" : "30";
                          if (hour > 20) return null;
                          const t = `${hour.toString().padStart(2, "0")}:${minutes}`;
                          return <SelectItem key={t} value={t}>{t}</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Scissors className="h-4 w-4" />
                    Servicios
                    {totalDuration > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {totalDuration} min
                      </Badge>
                    )}
                  </Label>
                  <OdooLineEditor
                    lines={serviceLines}
                    columns={serviceColumns}
                    onUpdateLine={updateServiceLine}
                    onRemoveLine={removeServiceLine}
                    onAddLine={addServiceLine}
                    emptyMessage="Agregar servicios"
                  />
                </div>

                {/* Products */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Productos
                  </Label>
                  <OdooLineEditor
                    lines={productLines}
                    columns={productColumns}
                    onUpdateLine={updateProductLine}
                    onRemoveLine={removeProductLine}
                    onAddLine={addProductLine}
                    emptyMessage="Agregar productos"
                  />
                </div>

                {/* General Discount */}
                <div className="p-3 bg-secondary/30 rounded-lg flex items-center justify-between">
                  <Label className="font-medium flex items-center gap-2 text-sm">
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
                      className="w-16 h-8 text-right"
                    />
                    <span className="text-muted-foreground text-sm">%</span>
                  </div>
                </div>

                {/* Payments */}
                <MultiPaymentSelector payments={payments} onChange={setPayments} total={total} />

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Notas</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Side - Summary */}
          <div className="w-full lg:w-80 flex flex-col bg-muted/30">
            <div className="p-4 border-b bg-background">
              <h3 className="font-semibold">Resumen</h3>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Client Info */}
                <div className="glass-card p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{getClientName()}</span>
                  </div>
                  {getClientPhone() && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {getClientPhone()}
                    </div>
                  )}
                </div>

                {/* Date/Time & Stylist */}
                <div className="glass-card p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{date}</span>
                    <span className="text-muted-foreground">•</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{time}</span>
                  </div>
                  {stylistId && (
                    <div className="flex items-center gap-2 text-sm">
                      <div
                        className="h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: getStylistColor(stylistId) }}
                      >
                        {getStylistName(stylistId).charAt(0)}
                      </div>
                      <span>{getStylistName(stylistId)}</span>
                    </div>
                  )}
                </div>

                {/* Status (only when editing) */}
                {appointment && (
                  <div className="glass-card p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estado</span>
                      <Badge className={cn("text-xs border", statusColors[currentStatus])}>
                        {statusLabels[currentStatus]}
                      </Badge>
                    </div>
                    {currentStatus !== "completed" && currentStatus !== "cancelled" && (
                      <div className="flex gap-2 pt-2">
                        {currentStatus === "scheduled" && (
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1" onClick={() => updateStatus("in-progress")}>
                            <PlayCircle className="h-3.5 w-3.5" />
                            Iniciar
                          </Button>
                        )}
                        {currentStatus === "in-progress" && (
                          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1 text-success" onClick={() => updateStatus("completed")}>
                            <CheckCircle className="h-3.5 w-3.5" />
                            Completar
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-destructive" onClick={() => updateStatus("cancelled")}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Services Summary */}
                {serviceLines.length > 0 && (
                  <div className="glass-card p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Scissors className="h-4 w-4" />
                      Servicios
                    </div>
                    <div className="space-y-1">
                      {serviceLines.filter(l => l.serviceName).map((line) => (
                        <div key={line.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate flex-1">{line.serviceName}</span>
                          <span className="font-medium">${Number(line.subtotal || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Summary */}
                {productLines.filter(l => l.productName).length > 0 && (
                  <div className="glass-card p-3 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Package className="h-4 w-4" />
                      Productos
                    </div>
                    <div className="space-y-1">
                      {productLines.filter(l => l.productName).map((line) => (
                        <div key={line.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate flex-1">
                            {line.quantity}x {line.productName}
                          </span>
                          <span className="font-medium">${Number(line.subtotal || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payments Summary */}
                <div className="glass-card p-3 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    Pagos
                  </div>
                  <div className="space-y-1">
                {payments.filter(p => Number(p.amount) > 0).map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {payment.method === "cash" ? "Efectivo" : payment.method === "card" ? "Tarjeta" : "Transferencia"}
                        </span>
                        <span className="font-medium">${Number(payment.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Total & Actions */}
            <div className="p-4 border-t bg-background space-y-3">
              <div className="space-y-1">
                {generalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString()}</span>
                  </div>
                )}
                {generalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Descuento ({generalDiscount}%)</span>
                    <span>-${generalDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1 gradient-bg border-0" onClick={handleSubmit} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {appointment ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
