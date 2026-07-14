import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarPlus, User, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contactName: string | null;
  contactPhone: string | null;
  existingClientId?: string | null;
  conversationId?: string;
  onScheduled?: () => void;
}

interface Svc { id: string; name: string; price: number; duration: number; }
interface Stylist { id: string; name: string; color: string; role: string; }
interface ApptRow { date: string; time: string; duration: number; employee_id?: string; stylist_id?: string; status?: string; }

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const DAY_START = 9 * 60;   // 09:00
const DAY_END = 20 * 60;    // 20:00
const SLOT = 15;            // 15-min grid
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export function QuickAppointmentSheet({ open, onOpenChange, contactName, contactPhone, existingClientId, conversationId, onScheduled }: Props) {
  const { currentBranch } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Svc[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState("");
  const [stylistId, setStylistId] = useState("");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [anchor, setAnchor] = useState<Date>(new Date(today));
  const [date, setDate] = useState<string>(ymd(today));
  const [time, setTime] = useState<string>("");

  const [rangeAppts, setRangeAppts] = useState<ApptRow[]>([]);
  const [loadingRange, setLoadingRange] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClientName(contactName || "");
    setClientPhone(contactPhone || "");
    setClientId(existingClientId || null);
    setNotes("");
    setServiceId("");
    setStylistId("");
    setDuration(30);
    setTime("");
    const t = new Date(); t.setHours(0, 0, 0, 0);
    setDate(ymd(t));
    setAnchor(new Date(t));
    setView("month");

    (async () => {
      setLoading(true);
      try {
        const [svcs, usrs] = await Promise.all([
          api.services.getAll({ active: true }),
          api.users.getAll(),
        ]);
        setServices((svcs || []).map((s: any) => ({
          id: s.id, name: s.name,
          price: Number(s.price) || 0,
          duration: Number(s.duration_minutes ?? s.duration) || 30,
        })));
        setStylists((usrs || []).filter((u: any) => u.role !== "Recepcionista"));

        if (!existingClientId && contactPhone) {
          const digits = contactPhone.replace(/\D/g, "");
          const all = await api.clients.getAll();
          const found = (all || []).find((c: any) => (c.phone || "").replace(/\D/g, "").endsWith(digits.slice(-8)));
          if (found) { setClientId(found.id); setClientName(found.name); }
        }
      } catch (e: any) {
        toast.error(e?.message || "Error cargando datos");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, contactName, contactPhone, existingClientId]);

  useEffect(() => {
    const svc = services.find((s) => s.id === serviceId);
    if (svc) setDuration(svc.duration || 30);
  }, [serviceId, services]);

  // Compute visible range depending on view
  const range = useMemo(() => {
    if (view === "day") {
      return { start: new Date(anchor), end: new Date(anchor) };
    }
    if (view === "week") {
      const d = new Date(anchor);
      const dow = (d.getDay() + 6) % 7; // Mon=0
      const start = new Date(d); start.setDate(d.getDate() - dow);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      return { start, end };
    }
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return { start, end };
  }, [view, anchor]);

  // Fetch appointments for the visible range for the selected stylist
  useEffect(() => {
    if (!stylistId || !open) { setRangeAppts([]); return; }
    (async () => {
      setLoadingRange(true);
      try {
        const data = await api.appointments.getAll({
          stylist_id: stylistId,
          start_date: ymd(range.start),
          end_date: ymd(range.end),
        });
        const rows: ApptRow[] = (data || [])
          .filter((a: any) => a.status !== "cancelled")
          .map((a: any) => ({
            date: a.date || (a.scheduled_at || "").split("T")[0],
            time: (a.time || "").slice(0, 5),
            duration: Number(a.duration_minutes || a.duration || 30),
            employee_id: a.employee_id,
            stylist_id: a.stylist_id,
            status: a.status,
          }));
        setRangeAppts(rows);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoadingRange(false);
      }
    })();
  }, [stylistId, range.start, range.end, open]);

  const endTime = time ? toTime(toMin(time) + duration) : "";

  // Month grid (Mon-first)
  const monthGrid = useMemo(() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const startWeekday = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
    const cells: Array<{ date: Date | null; key: string }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, key: `e${i}` });
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(anchor.getFullYear(), anchor.getMonth(), d);
      cells.push({ date: dt, key: ymd(dt) });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, key: `f${cells.length}` });
    return cells;
  }, [anchor]);

  // Week days (Mon-Sun)
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(range.start); d.setDate(range.start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [range.start]);

  const countByDay = useMemo(() => {
    const m: Record<string, number> = {};
    rangeAppts.forEach((a) => { if (a.date) m[a.date] = (m[a.date] || 0) + 1; });
    return m;
  }, [rangeAppts]);

  const isSlotBusy = (dateKey: string, minute: number) => {
    const end = minute + duration;
    return rangeAppts.some((a) => {
      if (a.date !== dateKey) return false;
      const s = toMin(a.time);
      const e = s + (a.duration || 30);
      return minute < e && end > s;
    });
  };

  // Time slots for selected day (day-view + fallback picker)
  const daySlots = useMemo(() => {
    const slots: Array<{ time: string; busy: boolean }> = [];
    for (let m = DAY_START; m + duration <= DAY_END; m += SLOT) {
      slots.push({ time: toTime(m), busy: isSlotBusy(date, m) });
    }
    return slots;
  }, [rangeAppts, date, duration]);

  const shift = (delta: number) => {
    const d = new Date(anchor);
    if (view === "day") d.setDate(d.getDate() + delta);
    else if (view === "week") d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setAnchor(d);
  };

  const handleSave = async () => {
    if (!clientName.trim()) return toast.error("Nombre del cliente requerido");
    if (!serviceId) return toast.error("Selecciona un servicio");
    if (!stylistId) return toast.error("Selecciona un estilista");
    if (!time) return toast.error("Selecciona un horario disponible");

    setSaving(true);
    try {
      let finalClientId = clientId;
      if (!finalClientId) {
        const created = await api.clients.create({ name: clientName.trim(), phone: clientPhone.trim() });
        finalClientId = created.id;
      }
      const svc = services.find((s) => s.id === serviceId)!;
      await api.appointments.create({
        client_id: finalClientId,
        stylist_id: stylistId,
        branch_id: currentBranch?.id,
        date, time,
        duration,
        end_time: endTime,
        services: [{ service_id: serviceId, price: svc.price, discount: 0 }],
        products: [],
        payments: [{ method: "cash", amount: 0 }],
        subtotal: svc.price,
        discount: 0,
        discount_percent: 0,
        total: svc.price,
        notes: notes || `Agendado desde WhatsApp (${contactPhone || ""})`,
      });
      if (conversationId && finalClientId && !existingClientId) {
        await supabase.from("whatsapp_conversations").update({ client_id: finalClientId }).eq("id", conversationId);
      }
      toast.success("Cita agendada correctamente");
      onOpenChange(false);
      onScheduled?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Error al agendar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Agendar cita
          </SheetTitle>
          <SheetDescription>Nueva cita para este contacto de WhatsApp</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="rounded-lg border p-3 bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" /> Cliente
                {clientId && <Badge variant="secondary" className="text-[10px]">existente</Badge>}
                {!clientId && <Badge className="text-[10px]">nuevo</Badge>}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre" />
                <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Teléfono" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label>Servicio</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un servicio" /></SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} · ${s.price} · {s.duration}min</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Estilista</Label>
                <Select value={stylistId} onValueChange={setStylistId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona un estilista" /></SelectTrigger>
                  <SelectContent>
                    {stylists.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calendar */}
            <div className="rounded-lg border p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shift(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-semibold capitalize text-center flex-1">
                  {view === "day" && anchor.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                  {view === "week" && `${range.start.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} – ${range.end.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`}
                  {view === "month" && `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shift(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex rounded-md border overflow-hidden text-xs">
                {(["day", "week", "month"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "flex-1 py-1 capitalize transition-colors",
                      view === v ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent",
                    )}
                  >
                    {v === "day" ? "Día" : v === "week" ? "Semana" : "Mes"}
                  </button>
                ))}
              </div>

              {view === "month" && (
                <>
                  <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-muted-foreground">
                    {WEEKDAYS.map((d, i) => <div key={i}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthGrid.map((cell) => {
                      if (!cell.date) return <div key={cell.key} />;
                      const key = ymd(cell.date);
                      const isPast = cell.date < today;
                      const isSelected = key === date;
                      const count = countByDay[key] || 0;
                      return (
                        <button
                          key={cell.key}
                          disabled={isPast || !stylistId}
                          onClick={() => { setDate(key); setTime(""); setAnchor(cell.date!); }}
                          className={cn(
                            "relative aspect-square rounded-md text-xs flex flex-col items-center justify-center transition-colors border",
                            isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-border",
                            isPast && "opacity-40 cursor-not-allowed hover:bg-background",
                            !stylistId && !isSelected && "opacity-60",
                          )}
                        >
                          <span className="font-medium">{cell.date.getDate()}</span>
                          {count > 0 && (
                            <span className={cn(
                              "absolute bottom-0.5 text-[9px] leading-none px-1 rounded-full",
                              isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                            )}>{count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {view === "week" && (
                <div className="overflow-x-auto">
                  <div className="min-w-[520px]">
                    <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-0.5 text-[10px] text-center text-muted-foreground mb-1">
                      <div />
                      {weekDays.map((d, i) => {
                        const isSel = ymd(d) === date;
                        const isPast = d < today;
                        return (
                          <button
                            key={i}
                            disabled={isPast || !stylistId}
                            onClick={() => { setDate(ymd(d)); setTime(""); setAnchor(d); }}
                            className={cn(
                              "rounded py-1 leading-tight",
                              isSel ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                              isPast && "opacity-40 cursor-not-allowed",
                            )}
                          >
                            <div>{WEEKDAYS[i]}</div>
                            <div className="font-semibold text-foreground">{d.getDate()}</div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {Array.from({ length: Math.ceil((DAY_END - DAY_START) / 30) }).map((_, rowIdx) => {
                        const minute = DAY_START + rowIdx * 30;
                        return (
                          <div key={minute} className="grid grid-cols-[48px_repeat(7,1fr)] gap-0.5 mb-0.5">
                            <div className="text-[10px] text-muted-foreground text-right pr-1 pt-1">{toTime(minute)}</div>
                            {weekDays.map((d, i) => {
                              const key = ymd(d);
                              const isPast = d < today;
                              const busy = stylistId ? isSlotBusy(key, minute) : false;
                              const isSel = key === date && time === toTime(minute);
                              return (
                                <button
                                  key={i}
                                  disabled={isPast || !stylistId || busy}
                                  onClick={() => { setDate(key); setTime(toTime(minute)); setAnchor(d); }}
                                  className={cn(
                                    "h-6 rounded border text-[9px] transition-colors",
                                    isSel && "bg-primary text-primary-foreground border-primary",
                                    !isSel && busy && "bg-destructive/15 border-destructive/30 cursor-not-allowed",
                                    !isSel && !busy && "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/25",
                                    isPast && "opacity-30 cursor-not-allowed",
                                  )}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {view === "day" && (
                <p className="text-[11px] text-center text-muted-foreground">
                  Selecciona el horario en el panel inferior
                </p>
              )}

              {!stylistId && (
                <p className="text-[11px] text-center text-muted-foreground">Selecciona un estilista para ver disponibilidad</p>
              )}

              {stylistId && (
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Libre</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />Ocupado</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Seleccionado</span>
                </div>
              )}
            </div>

            {/* Time slots */}
            {stylistId && (
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase text-muted-foreground">Horarios · {new Date(date + "T00:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" })}</Label>
                  <div className="flex items-center gap-1">
                    <Label className="text-[10px] text-muted-foreground">Dur.</Label>
                    <Input type="number" value={duration} min={5} step={5} className="h-7 w-16 text-xs"
                      onChange={(e) => { setDuration(Number(e.target.value) || 30); setTime(""); }} />
                    <span className="text-[10px] text-muted-foreground">min</span>
                  </div>
                </div>

                {loadingRange ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5 max-h-64 overflow-y-auto pr-1">
                    {daySlots.map((s) => {
                      const selected = time === s.time;
                      return (
                        <button
                          key={s.time}
                          disabled={s.busy}
                          onClick={() => setTime(s.time)}
                          className={cn(
                            "text-xs py-1.5 rounded-md border font-medium transition-colors",
                            selected && "bg-primary text-primary-foreground border-primary",
                            !selected && s.busy && "bg-destructive/10 text-destructive border-destructive/30 line-through cursor-not-allowed",
                            !selected && !s.busy && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
                          )}
                        >
                          {s.time}
                        </button>
                      );
                    })}
                  </div>
                )}

                {time && (
                  <p className="text-[11px] text-muted-foreground text-center pt-1">
                    De <strong>{time}</strong> a <strong>{endTime}</strong> ({duration} min)
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionales..." rows={2} />
            </div>

            <div className="flex gap-2 pt-2 sticky bottom-0 bg-background pb-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving || !time}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarPlus className="h-4 w-4 mr-2" />}
                Agendar
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
