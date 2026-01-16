import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut, Mail, Phone } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';

interface SubscriptionBlockedModalProps {
  open: boolean;
}

export function SubscriptionBlockedModal({ open }: SubscriptionBlockedModalProps) {
  const { logout, subscription } = usePermissions();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <DialogTitle className="text-xl">Suscripción Expirada</DialogTitle>
          <DialogDescription className="text-base">
            {subscription?.status === 'trial' ? (
              'Tu periodo de prueba ha terminado.'
            ) : subscription?.status === 'cancelled' ? (
              'Tu suscripción ha sido cancelada.'
            ) : (
              'Tu suscripción ha expirado.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Para continuar usando el sistema, contacta al administrador para renovar tu suscripción.
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <a 
                href="mailto:soporte@tusistema.com" 
                className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                soporte@tusistema.com
              </a>
              <a 
                href="tel:+525512345678" 
                className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                +52 55 1234 5678
              </a>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground">
            Una vez renovada tu suscripción, vuelve a iniciar sesión para acceder al sistema.
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="destructive" 
            className="w-full gap-2"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
