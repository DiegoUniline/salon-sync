import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { TrendingDown, TrendingUp, Receipt, ArrowLeftRight, Loader2 } from 'lucide-react';

export type CashMovementType = 'withdrawal' | 'deposit' | 'expense' | 'fund_change';

export const movementTypeConfig: Record<CashMovementType, {
  label: string;
  icon: any;
  color: string;
  sign: -1 | 1 | 0;
  description: string;
}> = {
  withdrawal:  { label: 'Retiro',           icon: TrendingDown,  color: 'text-red-600',    sign: -1, description: 'Sale efectivo de caja' },
  deposit:     { label: 'Depósito',         icon: TrendingUp,    color: 'text-green-600',  sign:  1, description: 'Entra efectivo a caja' },
  expense:     { label: 'Gasto en efectivo', icon: Receipt,      color: 'text-orange-600', sign: -1, description: 'Gasto pagado con caja' },
  fund_change: { label: 'Cambio de fondo',  icon: ArrowLeftRight,color: 'text-blue-600',   sign:  0, description: 'Ajuste, no altera saldo esperado' },
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shiftId: string;
  branchId?: string;
  onCreated?: () => void;
}

export function CashMovementDialog({ open, onOpenChange, shiftId, branchId, onCreated }: Props) {
  const [type, setType] = useState<CashMovementType>('withdrawal');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setType('withdrawal');
    setAmount('');
    setReason('');
  };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setSaving(true);
    try {
      await api.cashMovements.create({
        shift_id: shiftId,
        branch_id: branchId,
        type,
        amount: amt,
        reason: reason.trim() || undefined,
      });
      toast.success('Movimiento registrado');
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error al registrar movimiento');
    } finally {
      setSaving(false);
    }
  };

  const cfg = movementTypeConfig[type];
  const Icon = cfg.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${cfg.color}`} />
            Movimiento de caja
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tipo de movimiento</Label>
            <Select value={type} onValueChange={(v) => setType(v as CashMovementType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(movementTypeConfig) as [CashMovementType, typeof cfg][]).map(([k, c]) => (
                  <SelectItem key={k} value={k}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{cfg.description}</p>
          </div>

          <div className="space-y-2">
            <Label>Monto</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                min={0}
                step="0.01"
                className="pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Motivo / concepto</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Retiro para banco, pago a proveedor, ajuste de cambio..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving || !amount}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
