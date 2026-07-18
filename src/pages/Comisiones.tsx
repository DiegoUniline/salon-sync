import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CalendarRange, Download, DollarSign, Printer, Trash2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import api from "@/lib/api";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, subDays, startOfYear, endOfYear } from "date-fns";
import { getBusinessConfig } from "@/lib/businessConfig";
import { todayLocalISO } from "@/lib/utils";

const fmtMoney = (n: number) => `$${(n || 0).toFixed(2)}`;

function toCsv(rows: any[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printReceipt(payment: any) {
  const cfg = getBusinessConfig();
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`
    <!DOCTYPE html><html><head><title>Recibo ${payment.folio}</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 10px; }
      .c { text-align: center; }
      .b { font-weight: bold; }
      .row { display: flex; justify-content: space-between; margin: 3px 0; }
      hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
      .total { font-size: 14px; font-weight: bold; }
    </style></head><body>
      <div class="c b" style="font-size:14px">${cfg.name || 'SalonPro'}</div>
      ${cfg.address ? `<div class="c">${cfg.address}</div>` : ''}
      ${cfg.phone ? `<div class="c">Tel: ${cfg.phone}</div>` : ''}
      <hr/>
      <div class="c b">RECIBO DE PAGO</div>
      <div class="c">Comisiones y propinas</div>
      <hr/>
      <div class="row"><span>Folio:</span><span class="b">${payment.folio}</span></div>
      <div class="row"><span>Fecha:</span><span>${format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm')}</span></div>
      <div class="row"><span>Empleado:</span><span>${payment.employee_name || '-'}</span></div>
      <div class="row"><span>Periodo:</span><span>${payment.period_from} → ${payment.period_to}</span></div>
      <hr/>
      <div class="row"><span>Comisiones:</span><span>$${Number(payment.commission_amount||0).toFixed(2)}</span></div>
      <div class="row"><span>Propinas:</span><span>$${Number(payment.tips_amount||0).toFixed(2)}</span></div>
      <hr/>
      <div class="row total"><span>TOTAL:</span><span>$${Number(payment.total||0).toFixed(2)}</span></div>
      <div class="row"><span>Método:</span><span>${payment.payment_method}</span></div>
      ${payment.notes ? `<hr/><div>${payment.notes}</div>` : ''}
      <hr/>
      <div style="margin-top:30px" class="c">_____________________________</div>
      <div class="c">Firma del empleado</div>
      <div class="c" style="margin-top:15px;font-size:10px">Recibí de conformidad la cantidad indicada.</div>
    </body></html>`);
  w.document.close();
  w.print();
}

export default function Comisiones() {
  const today = todayLocalISO();
  const monthAgo = todayLocalISO(new Date(Date.now() - 30 * 86400000));
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(monthAgo);
  const [draftTo, setDraftTo] = useState(today);
  const [sales, setSales] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [payDialog, setPayDialog] = useState<any | null>(null);
  const [payMethod, setPayMethod] = useState("cash");
  const [payNotes, setPayNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("account_id").eq("user_id", user.id).maybeSingle();
      if (!profile?.account_id) { setSales([]); setPayments([]); return; }
      const [{ data: salesData }, pays] = await Promise.all([
        supabase.from("sales").select("*").eq("account_id", profile.account_id).gte("date", from).lte("date", to),
        api.commissionPayments.getAll({ start_date: from, end_date: to }),
      ]);
      setSales((salesData as any[]) || []);
      setPayments((pays as any[]) || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const rows = useMemo(() => {
    const map = new Map<string, { employee_id: string; name: string; ventas: number; total: number; comision: number; propinas: number; sale_ids: string[] }>();
    sales.forEach((s) => {
      const key = s.employee_id || "sin-asignar";
      const name = s.employee_name || "Sin asignar";
      // Commission base: exclude tips (paid separately) and honor any discount.
      const gross = Number(s.total || 0);
      const tip = Number(s.tip_amount || 0);
      const subtotal = Number(s.subtotal || 0);
      const discount = Number(s.discount || 0);
      const base = subtotal > 0 ? Math.max(0, subtotal - discount) : Math.max(0, gross - tip);
      // Commission is registered per product/service at sale time.
      const registrada = Number(s.commission || 0);
      const prev = map.get(key) || { employee_id: key, name, ventas: 0, total: 0, comision: 0, propinas: 0, sale_ids: [] };
      prev.ventas += 1;
      prev.total += base;
      prev.comision += registrada;
      prev.sale_ids.push(s.id);
      map.set(key, prev);

      const tips = Array.isArray(s.tips) ? s.tips : [];
      if (tips.length > 0) {
        tips.forEach((t: any) => {
          const empId = t.employee_id || "sin-asignar";
          const empName = t.employee_name || (empId === "sin-asignar" ? "Sin asignar" : empId);
          const row = map.get(empId) || { employee_id: empId, name: empName, ventas: 0, total: 0, comision: 0, propinas: 0, sale_ids: [] };
          row.propinas += Number(t.amount || 0);
          map.set(empId, row);
        });
      } else if (Number(s.tip_amount || 0) > 0) {
        const empId = s.tip_employee_id || s.employee_id || "sin-asignar";
        const empName = s.employee_name || "Sin asignar";
        const row = map.get(empId) || { employee_id: empId, name: empName, ventas: 0, total: 0, comision: 0, propinas: 0, sale_ids: [] };
        row.propinas += Number(s.tip_amount || 0);
        map.set(empId, row);
      }
    });
    return Array.from(map.values()).sort((a, b) => (b.total + b.propinas) - (a.total + a.propinas));
  }, [sales]);

  const totalPagar = rows.reduce((s, r) => s + r.comision + r.propinas, 0);
  const totalPagado = payments.reduce((s, p) => s + Number(p.total || 0), 0);

  const rangeLabel = `${format(new Date(from + 'T00:00'), 'dd MMM yyyy')} → ${format(new Date(to + 'T00:00'), 'dd MMM yyyy')}`;

  const applyQuickRange = (kind: string) => {
    const now = new Date();
    let f = now, t = now;
    switch (kind) {
      case 'today': f = now; t = now; break;
      case 'yesterday': { const y = subDays(now, 1); f = y; t = y; break; }
      case 'last7': f = subDays(now, 6); t = now; break;
      case 'thisWeek': f = startOfWeek(now, { weekStartsOn: 1 }); t = endOfWeek(now, { weekStartsOn: 1 }); break;
      case 'lastWeek': { const lw = subDays(now, 7); f = startOfWeek(lw, { weekStartsOn: 1 }); t = endOfWeek(lw, { weekStartsOn: 1 }); break; }
      case 'thisMonth': f = startOfMonth(now); t = endOfMonth(now); break;
      case 'lastMonth': { const lm = subMonths(now, 1); f = startOfMonth(lm); t = endOfMonth(lm); break; }
      case 'last30': f = subDays(now, 29); t = now; break;
      case 'thisYear': f = startOfYear(now); t = endOfYear(now); break;
    }
    setDraftFrom(todayLocalISO(f));
    setDraftTo(todayLocalISO(t));
  };

  const applyRange = () => {
    setFrom(draftFrom);
    setTo(draftTo);
    setRangeOpen(false);
    setTimeout(load, 0);
  };


  const openPay = (row: any) => {
    setPayDialog(row);
    setPayMethod("cash");
    setPayNotes("");
  };

  const confirmPay = async () => {
    if (!payDialog) return;
    const comision = payDialog.comision_registrada || payDialog.comision_calculada;
    const propinas = payDialog.propinas;
    const total = comision + propinas;
    if (total <= 0) { toast.error("No hay monto por pagar"); return; }
    if (payDialog.employee_id === "sin-asignar") { toast.error("No se puede pagar a 'Sin asignar'"); return; }
    setSaving(true);
    try {
      const payment = await api.commissionPayments.register({
        employee_id: payDialog.employee_id,
        employee_name: payDialog.name,
        period_from: from,
        period_to: to,
        commission_amount: comision,
        tips_amount: propinas,
        payment_method: payMethod,
        notes: payNotes || undefined,
        sales_included: payDialog.sale_ids,
      });
      toast.success(`Pago registrado: ${payment.folio}`);
      setPayDialog(null);
      await load();
      printReceipt(payment);
    } catch (e: any) {
      toast.error(e?.message || "Error al registrar pago");
    } finally {
      setSaving(false);
    }
  };

  const deletePayment = async (id: string) => {
    if (!confirm("¿Eliminar este pago? Esta acción no se puede deshacer.")) return;
    try {
      await api.commissionPayments.delete(id);
      toast.success("Pago eliminado");
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Comisiones</h1>
        <p className="text-muted-foreground">Liquidación de comisiones y propinas por empleado</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Rango de fechas</div>
            <Button
              variant="outline"
              onClick={() => { setDraftFrom(from); setDraftTo(to); setRangeOpen(true); }}
              className="min-w-[280px] justify-start"
            >
              <CalendarRange className="h-4 w-4 mr-2" />
              {rangeLabel}
            </Button>
          </div>
          <Button onClick={load} disabled={loading}>{loading ? "Cargando..." : "Actualizar"}</Button>
        </CardContent>
      </Card>

      <Dialog open={rangeOpen} onOpenChange={setRangeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Seleccionar rango de fechas</DialogTitle></DialogHeader>
          <div className="grid md:grid-cols-[200px_1fr] gap-6">
            <div className="space-y-1">
              <div className="text-xs uppercase text-muted-foreground mb-2">Rápido</div>
              {[
                ['today', 'Hoy'],
                ['yesterday', 'Ayer'],
                ['last7', 'Últimos 7 días'],
                ['thisWeek', 'Esta semana'],
                ['lastWeek', 'Semana anterior'],
                ['thisMonth', 'Este mes'],
                ['lastMonth', 'Mes anterior'],
                ['last30', 'Últimos 30 días'],
                ['thisYear', 'Este año'],
              ].map(([k, l]) => (
                <Button key={k} variant="ghost" size="sm" className="w-full justify-start" onClick={() => applyQuickRange(k)}>
                  {l}
                </Button>
              ))}
            </div>
            <div className="space-y-3">
              <div className="text-xs uppercase text-muted-foreground">Personalizado</div>
              <div>
                <label className="text-sm text-muted-foreground">Desde</label>
                <Input type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Hasta</label>
                <Input type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
              </div>
              <div className="text-sm text-muted-foreground pt-2">
                {format(new Date(draftFrom + 'T00:00'), 'dd MMM yyyy')} → {format(new Date(draftTo + 'T00:00'), 'dd MMM yyyy')}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRangeOpen(false)}>Cancelar</Button>
            <Button onClick={applyRange}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4" />Total a pagar en el periodo</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{fmtMoney(totalPagar)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Wallet className="h-4 w-4" />Total ya pagado</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-success">{fmtMoney(totalPagado)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detalle por empleado</CardTitle>
          <Button size="sm" variant="outline" onClick={() => toCsv(rows, `comisiones_${from}_${to}.csv`)}><Download className="h-4 w-4 mr-1" />CSV</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Empleado</TableHead><TableHead className="text-right">Ventas</TableHead><TableHead className="text-right">Total ventas</TableHead><TableHead className="text-right">Registrada</TableHead><TableHead className="text-right">Calculada ({defaultPct}%)</TableHead><TableHead className="text-right">Propinas</TableHead><TableHead className="text-right">A pagar</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => {
                const aPagar = (r.comision_registrada || r.comision_calculada) + r.propinas;
                return (
                  <TableRow key={r.employee_id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell className="text-right">{r.ventas}</TableCell>
                    <TableCell className="text-right">{fmtMoney(r.total)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtMoney(r.comision_registrada)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fmtMoney(r.comision_calculada)}</TableCell>
                    <TableCell className="text-right text-success">{fmtMoney(r.propinas)}</TableCell>
                    <TableCell className="text-right font-bold">{fmtMoney(aPagar)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openPay(r)} disabled={aPagar <= 0 || r.employee_id === "sin-asignar"}>
                        <Wallet className="h-4 w-4 mr-1" />Pagar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!rows.length && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Sin datos</TableCell></TableRow>}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-4">* &quot;Registrada&quot; usa el campo <code>commission</code> guardado con la venta. &quot;Calculada&quot; aplica el % por defecto sobre el total. Se paga la registrada si existe. Las propinas se suman aparte.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historial de pagos en el periodo</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Folio</TableHead><TableHead>Fecha</TableHead><TableHead>Empleado</TableHead><TableHead>Periodo</TableHead><TableHead className="text-right">Comisión</TableHead><TableHead className="text-right">Propinas</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Método</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.folio}</TableCell>
                  <TableCell>{format(new Date(p.paid_at), 'dd/MM/yy HH:mm')}</TableCell>
                  <TableCell>{p.employee_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.period_from} → {p.period_to}</TableCell>
                  <TableCell className="text-right">{fmtMoney(Number(p.commission_amount))}</TableCell>
                  <TableCell className="text-right text-success">{fmtMoney(Number(p.tips_amount))}</TableCell>
                  <TableCell className="text-right font-bold">{fmtMoney(Number(p.total))}</TableCell>
                  <TableCell className="capitalize">{p.payment_method}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => printReceipt(p)}><Printer className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => deletePayment(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {!payments.length && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Sin pagos registrados</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pagar comisiones y propinas</DialogTitle></DialogHeader>
          {payDialog && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Empleado:</span><span className="font-medium">{payDialog.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Periodo:</span><span>{from} → {to}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Comisiones:</span><span>{fmtMoney(payDialog.comision_registrada || payDialog.comision_calculada)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Propinas:</span><span className="text-success">{fmtMoney(payDialog.propinas)}</span></div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Total:</span><span>{fmtMoney((payDialog.comision_registrada || payDialog.comision_calculada) + payDialog.propinas)}</span></div>
              </div>
              <div>
                <label className="text-sm">Método de pago</label>
                <Select value={payMethod} onValueChange={setPayMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Notas (opcional)</label>
                <Textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialog(null)}>Cancelar</Button>
            <Button onClick={confirmPay} disabled={saving}>{saving ? "Registrando..." : "Registrar pago e imprimir"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
