import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useShift } from '@/hooks/useShift';
import { ShiftRequiredAlert } from '@/components/ShiftRequiredAlert';
import { TicketPrinter, type TicketData } from '@/components/TicketPrinter';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Plus, Minus, Trash2, Receipt, CalendarPlus, ChevronLeft, ChevronRight, Search, Scissors, Package as PackageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Product { id: string; name: string; price: number; stock: number; sku?: string; }
interface Service { id: string; name: string; price: number; duration: number; }
interface Stylist { id: string; full_name: string; color?: string; role?: string; }
interface Client { id: string; name: string; phone?: string; }
interface CartItem { type: 'product' | 'service'; item: Product | Service; quantity: number; }

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = (d: Date) => { const x = new Date(d); const day = (x.getDay() + 6) % 7; x.setDate(x.getDate() - day); x.setHours(0,0,0,0); return x; };
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CobroExpress() {
  const { currentBranch } = useApp();
  const { hasOpenShift, openShift, loading: shiftLoading } = useShift(currentBranch?.id || '');

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);

  // POS state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [searchItem, setSearchItem] = useState('');
  const [tab, setTab] = useState<'services' | 'products'>('services');
  const [saving, setSaving] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);

  // Reagenda state
  const [rServiceId, setRServiceId] = useState('');
  const [rStylistId, setRStylistId] = useState('');
  const [rDuration, setRDuration] = useState(30);
  const [rNotes, setRNotes] = useState('');
  const [rDate, setRDate] = useState(ymd(new Date()));
  const [rTime, setRTime] = useState('');
  const [weekAnchor, setWeekAnchor] = useState(startOfWeek(new Date()));
  const [weekAppts, setWeekAppts] = useState<any[]>([]);
  const [rSaving, setRSaving] = useState(false);
  const [loadingWeek, setLoadingWeek] = useState(false);

  // Load catalogs
  useEffect(() => {
    (async () => {
      if (!currentBranch?.id) return;
      setLoading(true);
      try {
        const [p, s, c, u] = await Promise.all([
          api.products.getAll({ active: true }),
          api.services.getAll({ active: true }),
          api.clients.getAll(),
          api.users.getAll(),
        ]);
        setProducts(p as any);
        setServices(s as any);
        setClients(c as any);
        setStylists((u as any).filter((x: any) => x.is_active !== false));
      } catch (e) {
        console.error(e);
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    })();
  }, [currentBranch?.id]);

  // Load week appointments
  useEffect(() => {
    (async () => {
      if (!currentBranch?.id) return;
      setLoadingWeek(true);
      try {
        const start = ymd(weekAnchor);
        const end = ymd(addDays(weekAnchor, 6));
        const data = await api.appointments.getAll({ branch_id: currentBranch.id, start_date: start, end_date: end });
        setWeekAppts(data as any);
      } finally {
        setLoadingWeek(false);
      }
    })();
  }, [weekAnchor, currentBranch?.id]);

  const cartTotal = cart.reduce((sum, i) => sum + (Number((i.item as any).price) || 0) * i.quantity, 0);

  const addToCart = (type: 'product' | 'service', item: Product | Service) => {
    setCart(prev => {
      const ex = prev.find(c => c.type === type && c.item.id === item.id);
      if (ex) return prev.map(c => c === ex ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { type, item, quantity: 1 }];
    });
  };
  const updateQty = (idx: number, delta: number) => {
    setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c));
  };
  const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const filteredItems = useMemo(() => {
    const q = searchItem.toLowerCase();
    if (tab === 'services') return services.filter(s => s.name.toLowerCase().includes(q));
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [tab, searchItem, services, products]);

  const completeSale = async () => {
    if (cart.length === 0) { toast.error('Agrega al menos un item'); return; }
    setSaving(true);
    const now = new Date();
    const folio = `V${Date.now().toString().slice(-6)}`;
    try {
      const items = cart.map(c => {
        const price = Number((c.item as any).price) || 0;
        return {
          item_type: c.type,
          item_id: c.item.id,
          name: c.item.name,
          quantity: c.quantity,
          price,
          subtotal: price * c.quantity,
        };
      });
      await api.sales.create({
        branch_id: currentBranch?.id,
        shift_id: openShift?.id,
        date: ymd(now),
        time: now.toTimeString().slice(0, 5),
        type: 'direct',
        items,
        payment_method: paymentMethod,
        payments: [{ method: paymentMethod, amount: cartTotal }],
        total: cartTotal,
        subtotal: cartTotal,
        client_id: selectedClientId,
        client_name: clientName || 'Cliente mostrador',
        client_phone: clientPhone || null,
      });

      setTicketData({
        folio,
        date: now,
        clientName: clientName || 'Cliente mostrador',
        services: cart.filter(c => c.type === 'service').map(c => ({ name: c.item.name, quantity: c.quantity, price: Number((c.item as any).price) || 0 })),
        products: cart.filter(c => c.type === 'product').map(c => ({ name: c.item.name, quantity: c.quantity, price: Number((c.item as any).price) || 0 })),
        subtotal: cartTotal, discount: 0, total: cartTotal,
        paymentMethod: paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : 'Transferencia',
      });
      setShowTicket(true);
      toast.success('Cobro registrado. Ahora reagenda a la clienta →');
      setCart([]);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Error al registrar cobro');
    } finally {
      setSaving(false);
    }
  };

  const scheduleAppt = async () => {
    if (!clientName.trim()) { toast.error('Nombre de clienta requerido'); return; }
    if (!rServiceId) { toast.error('Selecciona servicio'); return; }
    if (!rStylistId) { toast.error('Selecciona estilista'); return; }
    if (!rDate || !rTime) { toast.error('Selecciona fecha y hora'); return; }
    setRSaving(true);
    try {
      let clientId = selectedClientId;
      if (!clientId && clientName.trim()) {
        try {
          const existing = clients.find(c => c.name.toLowerCase() === clientName.trim().toLowerCase());
          if (existing) clientId = existing.id;
          else {
            const created = await api.clients.create({ name: clientName.trim(), phone: clientPhone || null });
            clientId = (created as any).id;
            setClients(prev => [...prev, created as any]);
          }
        } catch {}
      }
      const svc = services.find(s => s.id === rServiceId);
      await api.appointments.create({
        branch_id: currentBranch?.id,
        client_id: clientId,
        client_name: clientName,
        client_phone: clientPhone || null,
        stylist_id: rStylistId,
        employee_id: rStylistId,
        date: rDate,
        time: rTime,
        duration_minutes: rDuration,
        services: svc ? [{ service_id: svc.id, name: svc.name, price: svc.price, duration: svc.duration }] : [],
        subtotal: svc?.price || 0,
        total: svc?.price || 0,
        notes: rNotes || null,
        status: 'scheduled',
      });
      toast.success('Cita reagendada');
      setRServiceId(''); setRStylistId(''); setRTime(''); setRNotes('');
      // reload week
      const start = ymd(weekAnchor); const end = ymd(addDays(weekAnchor, 6));
      const data = await api.appointments.getAll({ branch_id: currentBranch?.id, start_date: start, end_date: end });
      setWeekAppts(data as any);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Error al reagendar');
    } finally {
      setRSaving(false);
    }
  };

  // week days
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i));
  const HOURS = Array.from({ length: 12 }, (_, i) => 9 + i); // 9..20

  if (shiftLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!hasOpenShift) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Cobro Express</h1>
        <ShiftRequiredAlert action="registrar cobros" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> Cobro Express</h1>
        <p className="text-muted-foreground text-sm">Cobra y reagenda a tu clienta en una sola pantalla</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: POS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" /> Cobro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Clienta</Label>
                <Input
                  list="clx-clients"
                  value={clientName}
                  onChange={e => {
                    const v = e.target.value;
                    setClientName(v);
                    const m = clients.find(c => c.name === v);
                    if (m) { setSelectedClientId(m.id); setClientPhone(m.phone || ''); }
                    else setSelectedClientId(null);
                  }}
                  placeholder="Nombre"
                />
                <datalist id="clx-clients">
                  {clients.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div>
                <Label className="text-xs">Teléfono</Label>
                <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="55..." />
              </div>
            </div>

            <Tabs value={tab} onValueChange={v => setTab(v as any)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="services"><Scissors className="h-3 w-3 mr-1" /> Servicios</TabsTrigger>
                <TabsTrigger value="products"><PackageIcon className="h-3 w-3 mr-1" /> Productos</TabsTrigger>
              </TabsList>
              <div className="relative mt-2">
                <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input className="pl-8" placeholder="Buscar…" value={searchItem} onChange={e => setSearchItem(e.target.value)} />
              </div>
              <TabsContent value="services" className="mt-2">
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-auto">
                  {filteredItems.map((it: any) => (
                    <button key={it.id} onClick={() => addToCart('service', it)} className="text-left p-2 rounded border hover:bg-accent text-xs">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-primary font-semibold">${Number(it.price || 0).toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="products" className="mt-2">
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-auto">
                  {filteredItems.map((it: any) => (
                    <button key={it.id} onClick={() => addToCart('product', it)} className="text-left p-2 rounded border hover:bg-accent text-xs">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="flex justify-between">
                        <span className="text-primary font-semibold">${Number(it.price || 0).toFixed(2)}</span>
                        <span className="text-muted-foreground">Stock: {it.stock ?? 0}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="border rounded">
              <div className="px-2 py-1.5 text-xs font-medium bg-muted">Carrito ({cart.length})</div>
              <div className="max-h-40 overflow-auto">
                {cart.length === 0 ? (
                  <div className="p-3 text-center text-xs text-muted-foreground">Sin items</div>
                ) : cart.map((c, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-1 border-t text-xs">
                    <span className="flex-1 truncate">{c.item.name}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(i, -1)}><Minus className="h-3 w-3" /></Button>
                    <span className="w-6 text-center">{c.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(i, 1)}><Plus className="h-3 w-3" /></Button>
                    <span className="w-16 text-right font-semibold">${((Number((c.item as any).price) || 0) * c.quantity).toFixed(2)}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(i)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 items-end">
              <div>
                <Label className="text-xs">Método de pago</Label>
                <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-2xl font-bold text-primary">${cartTotal.toFixed(2)}</div>
              </div>
            </div>

            <Button className="w-full" onClick={completeSale} disabled={saving || cart.length === 0}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Receipt className="h-4 w-4 mr-2" />}
              Cobrar ${cartTotal.toFixed(2)}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: Reagenda */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><CalendarPlus className="h-4 w-4" /> Reagendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Servicio</Label>
                <Select value={rServiceId} onValueChange={v => {
                  setRServiceId(v);
                  const s = services.find(x => x.id === v);
                  if (s) setRDuration(s.duration || 30);
                }}>
                  <SelectTrigger><SelectValue placeholder="Elegir…" /></SelectTrigger>
                  <SelectContent>
                    {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} · ${Number(s.price).toFixed(0)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Estilista</Label>
                <Select value={rStylistId} onValueChange={setRStylistId}>
                  <SelectTrigger><SelectValue placeholder="Elegir…" /></SelectTrigger>
                  <SelectContent>
                    {stylists.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="text-sm font-medium">
                {weekAnchor.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} - {addDays(weekAnchor, 6).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}><ChevronRight className="h-4 w-4" /></Button>
            </div>

            <div className="border rounded overflow-hidden">
              <div className="grid grid-cols-8 text-[10px] font-medium bg-muted">
                <div className="p-1"></div>
                {days.map((d, i) => {
                  const isSel = ymd(d) === rDate;
                  return (
                    <button key={i} onClick={() => setRDate(ymd(d))} className={cn('p-1 text-center border-l', isSel && 'bg-primary text-primary-foreground')}>
                      <div>{WEEKDAYS[i]}</div>
                      <div className="text-sm">{d.getDate()}</div>
                    </button>
                  );
                })}
              </div>
              <div className="max-h-56 overflow-auto">
                {HOURS.map(h => (
                  <div key={h} className="grid grid-cols-8 text-[10px] border-t">
                    <div className="p-1 text-right pr-1 text-muted-foreground">{String(h).padStart(2, '0')}:00</div>
                    {days.map((d, di) => {
                      const dateStr = ymd(d);
                      const timeStr = `${String(h).padStart(2, '0')}:00`;
                      const busy = weekAppts.some(a => {
                        const ad = (a.date || a.scheduled_at || '').toString().split('T')[0];
                        const at = (a.time || (a.scheduled_at ? a.scheduled_at.split('T')[1]?.slice(0, 5) : '')) || '';
                        if (ad !== dateStr) return false;
                        if (a.status === 'cancelled') return false;
                        const am = parseInt(at.split(':')[0] || '0');
                        return am === h;
                      });
                      const isSel = dateStr === rDate && rTime === timeStr;
                      return (
                        <button
                          key={di}
                          disabled={busy}
                          onClick={() => { setRDate(dateStr); setRTime(timeStr); }}
                          className={cn(
                            'border-l h-6 hover:bg-accent/50 transition-colors',
                            busy && 'bg-destructive/20 cursor-not-allowed',
                            isSel && 'bg-primary text-primary-foreground'
                          )}
                        />
                      );
                    })}
                  </div>
                ))}
                {loadingWeek && <div className="p-2 text-center text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin inline mr-1" />Cargando…</div>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Fecha</Label>
                <Input type="date" value={rDate} onChange={e => setRDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Hora</Label>
                <Input type="time" value={rTime} onChange={e => setRTime(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Duración (min)</Label>
                <Input type="number" value={rDuration} onChange={e => setRDuration(Number(e.target.value) || 30)} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notas</Label>
              <Textarea rows={2} value={rNotes} onChange={e => setRNotes(e.target.value)} placeholder="Opcional…" />
            </div>

            <Button className="w-full" onClick={scheduleAppt} disabled={rSaving}>
              {rSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CalendarPlus className="h-4 w-4 mr-2" />}
              Agendar cita
            </Button>
            {rDate && rTime && (
              <div className="text-xs text-center text-muted-foreground">
                Se enviará confirmación por WhatsApp si la clienta tiene teléfono
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showTicket && ticketData && (
        <TicketPrinter data={ticketData} open={showTicket} onOpenChange={setShowTicket} />
      )}
    </div>
  );
}
