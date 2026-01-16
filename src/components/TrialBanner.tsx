import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TrialBannerProps {
  daysRemaining: number;
  status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired';
  planName?: string;
}

export function TrialBanner({ daysRemaining, status, planName }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Don't show banner if subscription is active and has more than 7 days
  if (status === 'active' && daysRemaining > 7) return null;
  
  // Don't show if dismissed (only for non-critical warnings)
  if (dismissed && daysRemaining > 3) return null;

  // Determine banner style based on urgency
  let bannerClasses = '';
  let icon = <Clock className="h-4 w-4" />;
  let message = '';

  if (status === 'expired' || daysRemaining < 0) {
    bannerClasses = 'bg-destructive text-destructive-foreground';
    icon = <AlertTriangle className="h-4 w-4" />;
    message = 'Tu suscripción ha expirado. Contacta al administrador para renovar.';
  } else if (status === 'trial') {
    if (daysRemaining <= 1) {
      bannerClasses = 'bg-destructive text-destructive-foreground';
      icon = <AlertTriangle className="h-4 w-4" />;
      message = `¡Tu periodo de prueba termina ${daysRemaining === 0 ? 'hoy' : 'mañana'}!`;
    } else if (daysRemaining <= 3) {
      bannerClasses = 'bg-orange-500 text-white';
      icon = <AlertTriangle className="h-4 w-4" />;
      message = `Tu periodo de prueba termina en ${daysRemaining} días.`;
    } else if (daysRemaining <= 7) {
      bannerClasses = 'bg-warning text-warning-foreground';
      message = `Tu periodo de prueba termina en ${daysRemaining} días.`;
    } else {
      // More than 7 days, show subtle reminder
      bannerClasses = 'bg-info/10 text-info border-b border-info/20';
      message = `${planName || 'Plan'} - Prueba gratuita: ${daysRemaining} días restantes.`;
    }
  } else if (status === 'past_due') {
    bannerClasses = 'bg-orange-500 text-white';
    icon = <AlertTriangle className="h-4 w-4" />;
    message = 'Tu pago está pendiente. Contacta al administrador para evitar la suspensión.';
  } else if (daysRemaining <= 5) {
    // Active subscription nearing expiration
    bannerClasses = 'bg-warning text-warning-foreground';
    message = `Tu suscripción vence en ${daysRemaining} días.`;
  }

  if (!message) return null;

  return (
    <div className={cn('px-4 py-2 text-center text-sm flex items-center justify-center gap-2', bannerClasses)}>
      {icon}
      <span>{message}</span>
      {status === 'trial' && daysRemaining > 0 && (
        <Link to="/billing" className="underline font-medium ml-2 hover:opacity-80">
          Ver planes
        </Link>
      )}
      {daysRemaining > 3 && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 ml-2 hover:bg-white/20"
          onClick={() => setDismissed(true)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
