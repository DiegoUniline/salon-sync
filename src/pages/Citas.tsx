import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { useSearchParams } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useShift } from "@/hooks/useShift";
import api from "@/lib/api";
import { TicketPrinter, type TicketData } from "@/components/TicketPrinter";
import { AppointmentDetailView } from "@/components/AppointmentDetailView";
import { EditableCell } from "@/components/EditableCell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  PlayCircle,
  Receipt,
  Loader2,
  Trash2,
  Layers,
  Eye,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

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
}

interface Stylist {
  id: string;
  name: string;
  color: string;
  role: string;
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

interface AppointmentApi {
  id: string;
  date: string;
  time: string;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  client_id: string;
  client_name: string;
  client_phone: string;
  stylist_id: string;
  branch_id: string;
  subtotal?: number | string | null;
  discount?: number | string | null;
  discount_percent?: number | string | null;
  total?: number | string | null;
  services?: AppointmentService[];
  products?: AppointmentProduct[];
  payments?: AppointmentPayment[];
  notes?: string;
}

type DateFilterType = "all" | "today" | "week" | "month" | "year" | "custom";

export default function Citas() {
  const { currentBranch } = useApp();
  const { canCreate, canDelete } = usePermissions();
  const { hasOpenShift } = useShift(currentBranch?.id || "");
  const [searchParams] = useSearchParams();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [groupByStatus, setGroupByStatus] = useState(false);

  // Detail view state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<string>("");
  const [initialTime, setInitialTime] = useState<string>("");
  const [initialStylistId, setInitialStylistId] = useState<string>("");

  // Ticket state
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  const paymentLabels: Record<string, string> = {
    cash: "Efectivo",
    card: "Tarjeta",
    transfer: "Transferencia",
    mixed: "Mixto",
  };

  const normalizeAppointment = (a: AppointmentApi): Appointment => {
    return {
      id: a.id,
      date: a.date,
      time: a.time,
      status: a.status,
      client_id: a.client_id,
      client_name: a.client_name,
      client_phone: a.client_phone,
      stylist_id: a.stylist_id,
      branch_id: a.branch_id,
      notes: a.notes,
      subtotal: Number(a.subtotal ?? 0),
      discount: Number(a.discount ?? 0),
      discount_percent: Number(a.discount_percent ?? 0),
      total: Number(a.total ?? 0),
      services: a.services?.map((s) => ({
        ...s,
        price: Number(s.price),
        discount: Number(s.discount ?? 0),
      })) ?? [],
      products: a.products?.map((p) => ({
        ...p,
        price: Number(p.price),
        quantity: Number(p.quantity),
      })) ?? [],
      payments: a.payments ?? [],
    };
  };

  const loadAppointments = async () => {
    try {
      const data = await api.appointments.getAll({ branch_id: currentBranch?.id });
      setAppointments(data.map(normalizeAppointment));
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast.error("Error al cargar citas");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [appointmentsData, usersData] = await Promise.all([
          api.appointments.getAll({ branch_id: currentBranch?.id }),
          api.users.getAll(),
        ]);
        setAppointments(appointmentsData.map(normalizeAppointment));
        setStylists((usersData as Stylist[]).filter((u) => u.role !== "receptionist"));
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentBranch?.id]);

  // Handle URL params for opening appointment
  useEffect(() => {
    const urlParamDate = searchParams.get("date");
    const urlParamTime = searchParams.get("time");
    const urlParamStylist = searchParams.get("stylist");
    const urlParamEdit = searchParams.get("edit");

    if (urlParamEdit && appointments.length > 0) {
      const appointmentToEdit = appointments.find(a => a.id === urlParamEdit);
      if (appointmentToEdit) {
        openAppointmentDetail(appointmentToEdit);
        window.history.replaceState({}, "", "/citas");
      }
    } else if (urlParamDate || urlParamTime || urlParamStylist) {
      if (urlParamDate) setInitialDate(urlParamDate);
      if (urlParamTime) setInitialTime(urlParamTime);
      if (urlParamStylist) setInitialStylistId(urlParamStylist);
      setSelectedAppointment(null);
      setIsDetailOpen(true);
      window.history.replaceState({}, "", "/citas");
    }
  }, [searchParams, appointments]);

  // Calculate paid and balance for an appointment
  const getTotalPaid = (appointment: Appointment) =>
    appointment.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const getBalance = (appointment: Appointment) =>
    appointment.total - getTotalPaid(appointment);

  // Date filter logic - compare dates only (no time)
  const filterByDate = (appointment: Appointment) => {
    if (dateFilter === "all") return true;
    
    // Extract only the date part (YYYY-MM-DD) to avoid timezone issues
    const dateStr = appointment.date.split("T")[0];
    const [year, month, day] = dateStr.split("-").map(Number);
    // Create date at noon to avoid timezone edge cases
    const appointmentDate = new Date(year, month - 1, day, 12, 0, 0);
    
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Set to noon for consistent comparison

    switch (dateFilter) {
      case "today":
        return isWithinInterval(appointmentDate, { start: startOfDay(today), end: endOfDay(today) });
      case "week":
        return isWithinInterval(appointmentDate, { start: startOfWeek(today, { locale: es }), end: endOfWeek(today, { locale: es }) });
      case "month":
        return isWithinInterval(appointmentDate, { start: startOfMonth(today), end: endOfMonth(today) });
      case "year":
        return isWithinInterval(appointmentDate, { start: startOfYear(today), end: endOfYear(today) });
      case "custom":
        if (!customDateFrom || !customDateTo) return true;
        return isWithinInterval(appointmentDate, { start: startOfDay(customDateFrom), end: endOfDay(customDateTo) });
      default:
        return true;
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    const clientName = (a.client_name || "").toLowerCase();
    const clientPhone = a.client_phone || "";
    const matchesSearch = clientName.includes(search.toLowerCase()) || clientPhone.includes(search);
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    const matchesDate = filterByDate(a);
    const matchesTab = activeTab === "all" || (activeTab === "pending" && getBalance(a) > 0 && a.status !== "cancelled");
    return matchesSearch && matchesStatus && matchesDate && matchesTab;
  });

  const pendingCount = appointments.filter(a => getBalance(a) > 0 && a.status !== "cancelled").length;

  const openAppointmentDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setInitialDate("");
    setInitialTime("");
    setInitialStylistId("");
    setIsDetailOpen(true);
  };

  const openNewAppointment = () => {
    setSelectedAppointment(null);
    setInitialDate(new Date().toISOString().split("T")[0]);
    setInitialTime("09:00");
    setInitialStylistId("");
    setIsDetailOpen(true);
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedAppointment(null);
  };

  const updateStatus = async (id: string, status: Appointment["status"]) => {
    try {
      await api.appointments.updateStatus(id, status);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      toast.success(`Cita marcada como ${statusLabels[status].toLowerCase()}`);
    } catch (error) {
      toast.error("Error al actualizar estado");
    }
  };

  const updateAppointmentField = async (id: string, field: string, value: string) => {
    try {
      await api.appointments.update(id, { [field]: value });
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
      );
      toast.success("Cita actualizada");
    } catch (error) {
      toast.error("Error al actualizar cita");
    }
  };

  const showAppointmentTicket = (appointment: Appointment) => {
    const subtotal = appointment.subtotal ?? appointment.total + (appointment.discount ?? 0);
    let paymentMethodLabel = "Efectivo";
    if (appointment.payments && appointment.payments.length > 0) {
      if (appointment.payments.length > 1) {
        paymentMethodLabel = "Mixto";
      } else {
        paymentMethodLabel = paymentLabels[appointment.payments[0].method] || "Efectivo";
      }
    }

    setTicketData({
      folio: appointment.id,
      date: new Date(appointment.date),
      clientName: appointment.client_name,
      clientPhone: appointment.client_phone,
      professionalName: stylists.find((s) => s.id === appointment.stylist_id)?.name || "",
      services: appointment.services?.map((s) => ({
        name: s.name,
        quantity: 1,
        price: s.price,
      })) || [],
      products: appointment.products?.map((p) => ({
        name: p.name,
        quantity: p.quantity,
        price: p.price,
      })) || [],
      subtotal,
      discount: appointment.discount || 0,
      total: appointment.total,
      paymentMethod: paymentMethodLabel,
    });
    setShowTicket(true);
  };

  const deleteAppointment = async (id: string) => {
    try {
      await api.appointments.delete(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success("Cita eliminada");
    } catch (error) {
      toast.error("Error al eliminar cita");
    }
  };

  const getStylistColor = (stylistId: string) =>
    stylists.find((s) => s.id === stylistId)?.color || "#3B82F6";
  const getStylistName = (stylistId: string) =>
    stylists.find((s) => s.id === stylistId)?.name || "Sin asignar";

  const stylistOptions = stylists.map((s) => ({ value: s.id, label: s.name }));
  const statusOptions = [
    { value: "scheduled", label: "Agendada" },
    { value: "in-progress", label: "En proceso" },
    { value: "completed", label: "Completada" },
    { value: "cancelled", label: "Cancelada" },
  ];

  const renderAppointmentRow = (appointment: Appointment) => {
    const totalPaid = getTotalPaid(appointment);
    const balance = getBalance(appointment);

    return (
      <TableRow
        key={appointment.id}
        className="hover:bg-muted/50 transition-colors"
      >
        <TableCell>
          <EditableCell
            value={appointment.date.split("T")[0]}
            type="text"
            onSave={(value) => updateAppointmentField(appointment.id, "date", String(value))}
            displayValue={
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {appointment.date.split("T")[0].split("-").reverse().join("/")}
                  </p>
                  <p className="text-sm text-muted-foreground">{appointment.time}</p>
                </div>
              </div>
            }
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={appointment.client_name || "Cliente"}
            type="text"
            onSave={(value) => updateAppointmentField(appointment.id, "client_name", String(value))}
            displayValue={
              <div>
                <p className="font-medium">{appointment.client_name || "Cliente"}</p>
                <p className="text-sm text-muted-foreground">{appointment.client_phone || "-"}</p>
              </div>
            }
          />
        </TableCell>
        <TableCell>
          <EditableCell
            value={appointment.stylist_id}
            type="select"
            options={stylistOptions}
            onSave={(value) => updateAppointmentField(appointment.id, "stylist_id", String(value))}
            displayValue={
              <div className="flex items-center gap-2">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: getStylistColor(appointment.stylist_id) }}
                >
                  {getStylistName(appointment.stylist_id).charAt(0)}
                </div>
                <span>{getStylistName(appointment.stylist_id)}</span>
              </div>
            }
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            {appointment.services?.slice(0, 2).map((s) => (
              <Badge key={s.id} variant="secondary" className="text-xs">
                {s.name}
              </Badge>
            ))}
            {(appointment.services?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs">
                +{(appointment.services?.length || 0) - 2}
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell>
          <EditableCell
            value={appointment.status}
            type="select"
            options={statusOptions}
            onSave={(value) => updateStatus(appointment.id, value as Appointment["status"])}
            displayValue={
              <Badge className={cn("border", statusColors[appointment.status])}>
                {statusLabels[appointment.status]}
              </Badge>
            }
          />
        </TableCell>
        <TableCell className="text-right font-semibold">
          ${appointment.total?.toLocaleString()}
        </TableCell>
        <TableCell className="text-right text-success font-medium">
          ${totalPaid.toLocaleString()}
        </TableCell>
        <TableCell className="text-right">
          {balance > 0 ? (
            <span className="text-destructive font-semibold">${balance.toLocaleString()}</span>
          ) : (
            <span className="text-muted-foreground">$0</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center justify-end gap-1">
            {/* View detail button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-primary"
              onClick={() => openAppointmentDetail(appointment)}
              title="Ver detalle"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {/* Quick payment button when there's balance */}
            {balance > 0 && appointment.status !== "cancelled" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-success"
                onClick={() => openAppointmentDetail(appointment)}
                title="Agregar pago"
              >
                <DollarSign className="h-4 w-4" />
              </Button>
            )}
            {appointment.status === "scheduled" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-warning"
                onClick={() => updateStatus(appointment.id, "in-progress")}
                title="Iniciar"
              >
                <PlayCircle className="h-4 w-4" />
              </Button>
            )}
            {appointment.status === "in-progress" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-success"
                onClick={() => updateStatus(appointment.id, "completed")}
                title="Completar"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            {appointment.status === "completed" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-primary"
                onClick={() => showAppointmentTicket(appointment)}
                title="Imprimir ticket"
              >
                <Receipt className="h-4 w-4" />
              </Button>
            )}
            {(appointment.status === "scheduled" || appointment.status === "in-progress") && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => updateStatus(appointment.id, "cancelled")}
                title="Cancelar"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() => deleteAppointment(appointment.id)}
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderTable = (appointmentsToRender: Appointment[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha/Hora</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Estilista</TableHead>
          <TableHead>Servicios</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Pagado</TableHead>
          <TableHead className="text-right">Saldo</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointmentsToRender.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
              No hay citas registradas
            </TableCell>
          </TableRow>
        ) : (
          appointmentsToRender
            .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
            .map(renderAppointmentRow)
        )}
      </TableBody>
    </Table>
  );

  const renderGroupedTable = (appointmentsToRender: Appointment[]) => {
    const statuses: Appointment["status"][] = ["scheduled", "in-progress", "completed", "cancelled"];
    return (
      <div className="space-y-6">
        {statuses.map((status) => {
          const statusAppointments = appointmentsToRender.filter((a) => a.status === status);
          if (statusAppointments.length === 0) return null;
          return (
            <div key={status} className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Badge className={cn("border", statusColors[status])}>{statusLabels[status]}</Badge>
                <span className="text-muted-foreground">({statusAppointments.length})</span>
              </h3>
              <div className="glass-card rounded-xl overflow-hidden">
                {renderTable(statusAppointments)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Citas</h1>
            <p className="text-muted-foreground">Gestiona todas las citas de la sucursal</p>
          </div>
          <Button
            className="gradient-bg border-0"
            disabled={!canCreate("agenda")}
            onClick={openNewAppointment}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cita
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "pending")} className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Por Cobrar
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-4">
            {/* Filters */}
            <div className="glass-card rounded-xl p-4 space-y-4">
              {/* Search and Status Filter */}
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

              {/* Date Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant={dateFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("all")}
                >
                  Todas
                </Button>
                <Button
                  variant={dateFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("today")}
                >
                  Hoy
                </Button>
                <Button
                  variant={dateFilter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("week")}
                >
                  Esta Semana
                </Button>
                <Button
                  variant={dateFilter === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("month")}
                >
                  Este Mes
                </Button>
                <Button
                  variant={dateFilter === "year" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("year")}
                >
                  Este Año
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={dateFilter === "custom" ? "default" : "outline"} size="sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      {dateFilter === "custom" && customDateFrom && customDateTo
                        ? `${format(customDateFrom, "dd/MM")} - ${format(customDateTo, "dd/MM")}`
                        : "Personalizado"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Desde</p>
                        <CalendarComponent
                          mode="single"
                          selected={customDateFrom}
                          onSelect={(date) => {
                            setCustomDateFrom(date);
                            if (date && customDateTo) setDateFilter("custom");
                          }}
                          className="rounded-md border pointer-events-auto"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Hasta</p>
                        <CalendarComponent
                          mode="single"
                          selected={customDateTo}
                          onSelect={(date) => {
                            setCustomDateTo(date);
                            if (customDateFrom && date) setDateFilter("custom");
                          }}
                          className="rounded-md border pointer-events-auto"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex-1" />
                <Button
                  variant={groupByStatus ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupByStatus(!groupByStatus)}
                >
                  <Layers className="h-4 w-4 mr-1" />
                  Agrupar
                </Button>
              </div>
            </div>

            {/* Table */}
            {groupByStatus ? (
              renderGroupedTable(filteredAppointments)
            ) : (
              <div className="glass-card rounded-xl overflow-hidden">
                {renderTable(filteredAppointments)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-4 space-y-4">
            {/* Filters for pending tab */}
            <div className="glass-card rounded-xl p-4 space-y-4">
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
              </div>
              {/* Date Filters */}
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  variant={dateFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("all")}
                >
                  Todas
                </Button>
                <Button
                  variant={dateFilter === "today" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("today")}
                >
                  Hoy
                </Button>
                <Button
                  variant={dateFilter === "week" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("week")}
                >
                  Esta Semana
                </Button>
                <Button
                  variant={dateFilter === "month" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("month")}
                >
                  Este Mes
                </Button>
                <Button
                  variant={dateFilter === "year" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateFilter("year")}
                >
                  Este Año
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="glass-card rounded-xl overflow-hidden">
              {renderTable(filteredAppointments)}
            </div>
          </TabsContent>
        </Tabs>

        {ticketData && (
          <TicketPrinter open={showTicket} onOpenChange={setShowTicket} data={ticketData} />
        )}
      </div>

      {/* Full-screen Appointment Detail View */}
      <AnimatePresence>
        {isDetailOpen && (
          <AppointmentDetailView
            appointment={selectedAppointment}
            initialDate={initialDate}
            initialTime={initialTime}
            initialStylistId={initialStylistId}
            hasOpenShift={hasOpenShift}
            onClose={closeDetail}
            onSave={() => {
              loadAppointments();
              closeDetail();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
