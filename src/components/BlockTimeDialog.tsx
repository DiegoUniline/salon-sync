import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Stylist { id: string; name: string; color?: string }

interface BlockTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylists: Stylist[];
  onCreated?: () => void;
  initialDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
  initialStylistId?: string;
}

export function BlockTimeDialog({
  open, onOpenChange, stylists, onCreated,
  initialDate, initialStartTime, initialEndTime, initialStylistId,
}: BlockTimeDialogProps) {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [mode, setMode] = useState<'day' | 'hours'>('day');
  const [scope, setScope] = useState<'account' | 'employee'>('account');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [targetId, setTargetId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialDate) { setStartDate(initialDate); setEndDate(initialDate); }
    if (initialStartTime && initialEndTime) {
      setMode('hours');
      setStartTime(initialStartTime);
      setEndTime(initialEndTime);
    }
    if (initialStylistId) {
      setScope('employee');
      setTargetId(initialStylistId);
    }
  }, [open, initialDate, initialStartTime, initialEndTime, initialStylistId]);

  const handleSave = async () => {
    if (scope === 'employee' && !targetId) {
      toast({ title: 'Selecciona un colaborador', variant: 'destructive' });
      return;
    }
    if (mode === 'hours' && startTime >= endTime) {
      toast({ title: 'La hora fin debe ser mayor que la inicial', variant: 'destructive' });
      return;
    }
    if (startDate > endDate) {
      toast({ title: 'La fecha fin debe ser posterior o igual', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.schedules.createBlocked({
        type: scope,
        target_id: scope === 'employee' ? targetId : null,
        start_date: startDate,
        end_date: endDate,
        start_time: mode === 'hours' ? `${startTime}:00` : null,
        end_time: mode === 'hours' ? `${endTime}:00` : null,
        reason: reason.trim() || null,
      });
      toast({ title: 'Bloqueo creado', description: mode === 'day' ? 'Día(s) bloqueado(s) correctamente' : 'Horario bloqueado correctamente' });
      onCreated?.();
      onOpenChange(false);
      setReason('');
    } catch (e: any) {
      toast({ title: 'No se pudo bloquear', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-warning" /> Bloquear agenda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Tipo de bloqueo</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as any)} className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer ${mode==='day' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <RadioGroupItem value="day" /> <span className="text-sm">Día(s) completo(s)</span>
              </label>
              <label className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer ${mode==='hours' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <RadioGroupItem value="hours" /> <span className="text-sm">Rango de horas</span>
              </label>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Desde</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {mode === 'hours' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Hora inicio</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Hora fin</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Alcance</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as any)} className="grid grid-cols-2 gap-2">
              <label className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer ${scope==='account' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <RadioGroupItem value="account" /> <span className="text-sm">Todo el salón</span>
              </label>
              <label className={`flex items-center gap-2 p-2.5 rounded-md border cursor-pointer ${scope==='employee' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <RadioGroupItem value="employee" /> <span className="text-sm">Un colaborador</span>
              </label>
            </RadioGroup>
          </div>

          {scope === 'employee' && (
            <div>
              <Label className="text-xs">Colaborador</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                <SelectContent>
                  {stylists.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs">Motivo (opcional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: Vacaciones, mantenimiento, evento privado…"
              rows={2}
              maxLength={200}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Bloquear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
