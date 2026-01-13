import { AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ShiftRequiredAlertProps {
  action?: string;
}

export function ShiftRequiredAlert({ action = 'realizar esta acción' }: ShiftRequiredAlertProps) {
  const navigate = useNavigate();

  return (
    <div className="glass-card rounded-xl p-6 text-center border-2 border-warning/30 bg-warning/5">
      <AlertCircle className="h-12 w-12 mx-auto mb-3 text-warning" />
      <h3 className="text-lg font-semibold mb-1">Se requiere turno abierto</h3>
      <p className="text-muted-foreground mb-4">
        Debes abrir un turno antes de {action}.
      </p>
      <Button 
        className="gradient-bg border-0"
        onClick={() => navigate('/turnos')}
      >
        <LogIn className="h-4 w-4 mr-2" />
        Ir a Turnos
      </Button>
    </div>
  );
}
