import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { useShift } from "@/hooks/useShift";
import { ShiftRequiredAlert } from "@/components/ShiftRequiredAlert";
import api from "@/lib/api";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Search,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Types
interface Payment {
  id: string;
  appointment_id: string;
  method: "cash" | "card" | "transfer";
  amount: number;
  reference?: string;
  created_at: string;
  client_name?: string;
  stylist_name?: string;
  appointment_date?: string;
  appointment_total?: number;
}

interface GroupedPayments {
  key: string;
  label: string;
  payments: Payment[];
  total: number;
  expanded: boolean;
}

type GroupByOption = "none" | "method" | "month" | "year" | "method-month" | "method-year";

const methodLabels: Record<string, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

const methodIcons: Record<string, typeof Banknote> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowRightLeft,
};

const methodColors: Record<string, string> = {
  cash: "bg-success/20 text-success border-success/30",
  card: "bg-info/20 text-info border-info/30",
  transfer: "bg-warning/20 text-warning border-warning/30",
};

export default function Pagos() {
  const { currentBranch } = useApp();
  const { hasOpenShift } = useShift(currentBranch?.id || '');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMethod, setEditMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [editReference, setEditReference] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = startOfMonth(new Date());
    return format(d, "yyyy-MM-dd");
  });
  const [endDate, setEndDate] = useState(() => {
    const d = endOfMonth(new Date());
    return format(d, "yyyy-MM-dd");
  });

  // Load payments from appointments
  const loadPayments = async () => {
    if (!currentBranch?.id) return;
    
    setLoading(true);
    try {
      const appointments = await api.appointments.getAll({
        branch_id: currentBranch.id,
        start_date: startDate,
        end_date: endDate,
      });

      const allPayments: Payment[] = [];
      for (const apt of appointments) {
        if (apt.payments && Array.isArray(apt.payments)) {
          for (const p of apt.payments) {
            allPayments.push({
              id: p.id || `${apt.id}-${p.method}-${Math.random()}`,
              appointment_id: apt.id,
              method: p.method,
              amount: Number(p.amount),
              reference: p.reference,
              created_at: apt.created_at || apt.date,
              client_name: apt.client_name || apt.client?.name,
              stylist_name: apt.stylist_name || apt.stylist?.name,
              appointment_date: apt.date,
              appointment_total: Number(apt.total),
            });
          }
        }
      }

      setPayments(allPayments);
    } catch (error) {
      console.error("Error loading payments:", error);
      toast.error("Error al cargar pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [currentBranch?.id, startDate, endDate]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchesSearch =
        !search ||
        p.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.reference?.toLowerCase().includes(search.toLowerCase());
      const matchesMethod = methodFilter === "all" || p.method === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [payments, search, methodFilter]);

  // Grouped payments
  const groupedPayments = useMemo((): GroupedPayments[] => {
    if (groupBy === "none") {
      return [
        {
          key: "all",
          label: "Todos los pagos",
          payments: filteredPayments,
          total: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
          expanded: true,
        },
      ];
    }

    const groups = new Map<string, Payment[]>();

    filteredPayments.forEach((p) => {
      let key = "";
      const date = p.appointment_date ? parseISO(p.appointment_date) : new Date();

      switch (groupBy) {
        case "method":
          key = p.method;
          break;
        case "month":
          key = format(date, "yyyy-MM");
          break;
        case "year":
          key = format(date, "yyyy");
          break;
        case "method-month":
          key = `${p.method}|${format(date, "yyyy-MM")}`;
          break;
        case "method-year":
          key = `${p.method}|${format(date, "yyyy")}`;
          break;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(p);
    });

    const result: GroupedPayments[] = [];
    groups.forEach((payments, key) => {
      let label = key;
      
      if (groupBy === "method") {
        label = methodLabels[key] || key;
      } else if (groupBy === "month") {
        label = format(parseISO(`${key}-01`), "MMMM yyyy", { locale: es });
      } else if (groupBy === "year") {
        label = `Año ${key}`;
      } else if (groupBy === "method-month") {
        const [method, month] = key.split("|");
        label = `${methodLabels[method]} - ${format(parseISO(`${month}-01`), "MMMM yyyy", { locale: es })}`;
      } else if (groupBy === "method-year") {
        const [method, year] = key.split("|");
        label = `${methodLabels[method]} - ${year}`;
      }

      result.push({
        key,
        label,
        payments,
        total: payments.reduce((sum, p) => sum + p.amount, 0),
        expanded: expandedGroups.has(key),
      });
    });

    result.sort((a, b) => b.key.localeCompare(a.key));
    return result;
  }, [filteredPayments, groupBy, expandedGroups]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groupedPayments.map((g) => g.key)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  // Edit payment - requires open shift
  const openEditDialog = (payment: Payment) => {
    if (!hasOpenShift) {
      toast.error("Debes abrir un turno para editar pagos");
      return;
    }
    setEditingPayment(payment);
    setEditAmount(String(payment.amount));
    setEditMethod(payment.method);
    setEditReference(payment.reference || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPayment) return;

    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }

    setSaving(true);
    try {
      const appointment = await api.appointments.getById(editingPayment.appointment_id);
      
      if (appointment.payments) {
        const updatedPayments = appointment.payments.map((p: any) => {
          if (p.id === editingPayment.id || 
              (p.method === editingPayment.method && Number(p.amount) === editingPayment.amount)) {
            return {
              ...p,
              method: editMethod,
              amount: amount,
              reference: editMethod !== "cash" ? editReference : null,
            };
          }
          return p;
        });

        await api.appointments.update(editingPayment.appointment_id, {
          payments: updatedPayments,
        });
      }

      toast.success("Pago actualizado");
      setEditDialogOpen(false);
      loadPayments();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error("Error al actualizar pago");
    } finally {
      setSaving(false);
    }
  };

  // Delete payment - requires open shift
  const openDeleteDialog = (payment: Payment) => {
    if (!hasOpenShift) {
      toast.error("Debes abrir un turno para eliminar pagos");
      return;
    }
    setDeletingPayment(payment);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingPayment) return;

    try {
      const appointment = await api.appointments.getById(deletingPayment.appointment_id);
      
      if (appointment.payments) {
        const updatedPayments = appointment.payments.filter((p: any) => {
          return !(p.id === deletingPayment.id || 
              (p.method === deletingPayment.method && Number(p.amount) === deletingPayment.amount));
        });

        if (updatedPayments.length === 0) {
          toast.error("No puedes eliminar el único pago de una cita");
          setDeleteDialogOpen(false);
          return;
        }

        await api.appointments.update(deletingPayment.appointment_id, {
          payments: updatedPayments,
        });
      }

      toast.success("Pago eliminado");
      setDeleteDialogOpen(false);
      loadPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Error al eliminar pago");
    }
  };

  const money = (n: number) =>
    n.toLocaleString("es-MX", {
      style: "currency",
      currency: "MXN",
    });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalByMethod = {
    cash: filteredPayments.filter((p) => p.method === "cash").reduce((sum, p) => sum + p.amount, 0),
    card: filteredPayments.filter((p) => p.method === "card").reduce((sum, p) => sum + p.amount, 0),
    transfer: filteredPayments.filter((p) => p.method === "transfer").reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona todos los pagos de las citas
          </p>
        </div>
        {!hasOpenShift && (
          <Badge variant="outline" className="gap-1 border-warning text-warning">
            <AlertCircle className="h-3 w-3" />
            Turno cerrado - Solo lectura
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{money(totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.length} pagos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Efectivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{money(totalByMethod.cash)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Tarjeta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{money(totalByMethod.card)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Transferencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{money(totalByMethod.transfer)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente o referencia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-36"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-36"
              />
            </div>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
              </SelectContent>
            </Select>

            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupByOption)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Agrupar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin agrupar</SelectItem>
                <SelectItem value="method">Por método</SelectItem>
                <SelectItem value="month">Por mes</SelectItem>
                <SelectItem value="year">Por año</SelectItem>
                <SelectItem value="method-month">Método + Mes</SelectItem>
                <SelectItem value="method-year">Método + Año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {groupBy !== "none" && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={expandAll}>
                Expandir todo
              </Button>
              <Button size="sm" variant="outline" onClick={collapseAll}>
                Colapsar todo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <ScrollArea className="h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Banknote className="h-12 w-12 mb-4 opacity-50" />
              <p>No hay pagos en este período</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedPayments.map((group) => (
                  <>
                    {groupBy !== "none" && (
                      <TableRow
                        key={`group-${group.key}`}
                        className="bg-muted/50 cursor-pointer hover:bg-muted"
                        onClick={() => toggleGroup(group.key)}
                      >
                        <TableCell colSpan={6}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {group.expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span className="font-medium">{group.label}</span>
                              <Badge variant="secondary">{group.payments.length}</Badge>
                            </div>
                            <span className="font-bold">{money(group.total)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {(groupBy === "none" || group.expanded) &&
                      group.payments.map((payment) => {
                        const MethodIcon = methodIcons[payment.method];
                        return (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {payment.appointment_date
                                ? format(parseISO(payment.appointment_date), "dd/MM/yyyy", { locale: es })
                                : "-"}
                            </TableCell>
                            <TableCell>{payment.client_name || "-"}</TableCell>
                            <TableCell>
                              <Badge className={cn("gap-1", methodColors[payment.method])}>
                                <MethodIcon className="h-3 w-3" />
                                {methodLabels[payment.method]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {money(payment.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {payment.reference || "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => openEditDialog(payment)}
                                  disabled={!hasOpenShift}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => openDeleteDialog(payment)}
                                  disabled={!hasOpenShift}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Método</Label>
              <Select value={editMethod} onValueChange={(v) => setEditMethod(v as any)}>
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
            {editMethod !== "cash" && (
              <div className="space-y-2">
                <Label>Referencia</Label>
                <Input
                  value={editReference}
                  onChange={(e) => setEditReference(e.target.value)}
                  placeholder="Número de referencia"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el pago de {money(deletingPayment?.amount || 0)}. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
