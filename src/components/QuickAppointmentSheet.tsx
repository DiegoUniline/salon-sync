import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarPlus, User } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useApp } from "@/contexts/AppContext";
import { supabase } from "@/integrations/supabase/client";

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

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

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
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setClientName(contactName || "");
    setClientPhone(contactPhone || "");
    setClientId(existingClientId || null);
    setNotes("");
    setServiceId("");
    setStylistId("");
    setDate(new Date().toISOString().split("T")[0]);
    setTime("09:00");
    setDuration(30);

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

        // Try to match client by phone if no id provided
        if (!existingClientId && contactPhone) {
          const digits = contactPhone.replace(/\D/g, "");
          const all = await api.clients.getAll();
          const found = (all || []).find((c: any) => (c.phone || "").replace(/\D/g, "").endsWith(digits.slice(-8)));
          if (found) {
            setClientId(found.id);
            setClientName(found.name);
          }
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

  const endTime = toTime(toMin(time) + duration);

  const handleSave = async () => {
    if (!clientName.trim()) return toast.error("Nombre del cliente requerido");
    if (!serviceId) return toast.error("Selecciona un servicio");
    if (!stylistId) return toast.error("Selecciona un estilista");

    setSaving(true);
    try {
      let finalClientId = clientId;
      if (!finalClientId) {
        const created = await api.clients.create({
          name: clientName.trim(),
          phone: clientPhone.trim(),
        });
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

      // Link client to conversation for next time
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
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-primary" />
            Agendar cita
          </SheetTitle>
          <SheetDescription>Nueva cita para este contacto de WhatsApp</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Fecha</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Hora</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Duración (min)</Label>
                <Input type="number" value={duration} min={5} step={5} onChange={(e) => setDuration(Number(e.target.value) || 30)} />
              </div>
              <div className="space-y-1.5">
                <Label>Termina</Label>
                <Input value={endTime} readOnly disabled />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Notas</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas opcionales..." rows={3} />
            </div>

            <div className="flex gap-2 pt-2 sticky bottom-0 bg-background pb-2">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
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
