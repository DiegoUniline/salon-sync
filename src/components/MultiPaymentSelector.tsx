import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Banknote, CreditCard, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Payment {
  id: string;
  method: 'cash' | 'card' | 'transfer';
  amount: number;
  reference?: string;
}

interface MultiPaymentSelectorProps {
  payments: Payment[];
  onChange: (payments: Payment[]) => void;
  total: number;
}

const paymentMethods = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'card', label: 'Tarjeta', icon: CreditCard },
  { value: 'transfer', label: 'Transferencia', icon: ArrowRightLeft },
];

export function MultiPaymentSelector({ payments, onChange, total }: MultiPaymentSelectorProps) {
  const addPayment = () => {
    const remaining = total - payments.reduce((sum, p) => sum + p.amount, 0);
    onChange([
      ...payments,
      { 
        id: `pay-${Date.now()}`, 
        method: 'cash', 
        amount: Math.max(0, remaining),
      }
    ]);
  };

  const updatePayment = (id: string, field: keyof Payment, value: any) => {
    onChange(
      payments.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  const removePayment = (id: string) => {
    if (payments.length > 1) {
      onChange(payments.filter(p => p.id !== id));
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;
  const change = totalPaid > total ? totalPaid - total : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Métodos de Pago</Label>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={addPayment}
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar
        </Button>
      </div>

      <div className="space-y-3">
        {payments.map((payment, index) => {
          const PaymentIcon = paymentMethods.find(m => m.value === payment.method)?.icon || Banknote;
          
          return (
            <div 
              key={payment.id}
              className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
            >
              <div className="flex items-center gap-2 min-w-[140px]">
                <Select
                  value={payment.method}
                  onValueChange={(v: 'cash' | 'card' | 'transfer') => updatePayment(payment.id, 'method', v)}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                      <PaymentIcon className="h-4 w-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(m => (
                      <SelectItem key={m.value} value={m.value}>
                        <div className="flex items-center gap-2">
                          <m.icon className="h-4 w-4" />
                          {m.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={payment.amount}
                  onChange={(e) => updatePayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                  className="text-right font-medium"
                  placeholder="Monto"
                />
              </div>

              {payment.method !== 'cash' && (
                <Input
                  value={payment.reference || ''}
                  onChange={(e) => updatePayment(payment.id, 'reference', e.target.value)}
                  className="w-32"
                  placeholder="Referencia"
                />
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePayment(payment.id)}
                disabled={payments.length === 1}
                className={cn(
                  'text-destructive hover:text-destructive',
                  payments.length === 1 && 'opacity-30'
                )}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total a pagar:</span>
          <span className="font-medium">${total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total pagado:</span>
          <span className="font-medium">${totalPaid.toLocaleString()}</span>
        </div>
        {remaining > 0 && (
          <div className="flex justify-between text-sm text-warning">
            <span>Falta por pagar:</span>
            <span className="font-medium">${remaining.toLocaleString()}</span>
          </div>
        )}
        {change > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>Cambio:</span>
            <span className="font-medium">${change.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
