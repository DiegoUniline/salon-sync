import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface MobileTableCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileTableCard({ children, className, onClick }: MobileTableCardProps) {
  return (
    <Card 
      className={cn(
        'p-4 space-y-3 md:hidden cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

interface MobileFieldProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function MobileField({ label, value, className }: MobileFieldProps) {
  return (
    <div className={cn('flex justify-between items-start gap-2', className)}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

interface MobileCardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  icon?: ReactNode;
}

export function MobileCardHeader({ title, subtitle, badge, icon }: MobileCardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon}
        <div className="min-w-0">
          <div className="font-medium truncate">{title}</div>
          {subtitle && <div className="text-sm text-muted-foreground truncate">{subtitle}</div>}
        </div>
      </div>
      {badge}
    </div>
  );
}

interface MobileCardActionsProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardActions({ children, className }: MobileCardActionsProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2 pt-2 border-t', className)}>
      {children}
    </div>
  );
}
