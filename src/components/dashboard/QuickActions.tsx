import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  CalendarPlus,
  UserPlus,
  ShoppingBag,
  Receipt,
  Clock,
  ArrowRight,
} from 'lucide-react';

const actions = [
  {
    title: 'Nueva Cita',
    description: 'Agendar cita para cliente',
    icon: CalendarPlus,
    href: '/citas',
    color: 'bg-primary/10 text-primary',
  },
  {
    title: 'Nuevo Cliente',
    description: 'Registrar nuevo cliente',
    icon: UserPlus,
    href: '/clientes',
    color: 'bg-success/10 text-success',
  },
  {
    title: 'Venta Rápida',
    description: 'Vender productos',
    icon: ShoppingBag,
    href: '/ventas',
    color: 'bg-accent/10 text-accent',
  },
  {
    title: 'Registrar Gasto',
    description: 'Agregar nuevo gasto',
    icon: Receipt,
    href: '/gastos',
    color: 'bg-warning/10 text-warning',
  },
  {
    title: 'Abrir Turno',
    description: 'Iniciar nuevo turno',
    icon: Clock,
    href: '/turnos',
    color: 'bg-info/10 text-info',
  },
];

export function QuickActions() {
  return (
    <div className="glass-card rounded-xl p-4 md:p-5">
      <h3 className="text-lg font-semibold mb-3 md:mb-4">Acciones Rápidas</h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
        {actions.map((action, index) => (
          <Link
            key={action.title}
            to={action.href}
            className={cn(
              'group flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-4 rounded-xl transition-all duration-200',
              'bg-secondary/30 hover:bg-secondary border border-transparent hover:border-border',
              'fade-up'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn('p-2 md:p-3 rounded-xl transition-transform group-hover:scale-110', action.color)}>
              <action.icon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <span className="text-xs md:text-sm font-medium text-center leading-tight">{action.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
