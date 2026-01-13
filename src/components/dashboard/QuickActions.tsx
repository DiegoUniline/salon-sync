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
    <div className="glass-card rounded-xl p-5">
      <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {actions.map((action, index) => (
          <Link
            key={action.title}
            to={action.href}
            className={cn(
              'group flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200',
              'bg-secondary/30 hover:bg-secondary border border-transparent hover:border-border',
              'fade-up'
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn('p-3 rounded-xl transition-transform group-hover:scale-110', action.color)}>
              <action.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-center">{action.title}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
