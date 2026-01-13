import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  CalendarCheck,
  Warehouse,
  ShoppingCart,
  Receipt,
  DollarSign,
  Clock,
  FileText,
  Settings,
  Wrench,
} from 'lucide-react';

const pageInfo: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  '/citas': {
    title: 'Gestión de Citas',
    description: 'Crear, editar y gestionar citas con todos los detalles de servicios, productos y pagos.',
    icon: CalendarCheck,
  },
  '/inventario': {
    title: 'Control de Inventario',
    description: 'Gestión de stock por sucursal, entradas, salidas y alertas de stock bajo.',
    icon: Warehouse,
  },
  '/compras': {
    title: 'Registro de Compras',
    description: 'Control de compras a proveedores con impacto automático en inventario.',
    icon: ShoppingCart,
  },
  '/gastos': {
    title: 'Control de Gastos',
    description: 'Registro de gastos por categoría: renta, servicios, insumos, nómina y otros.',
    icon: Receipt,
  },
  '/ventas': {
    title: 'Punto de Venta',
    description: 'Ventas de productos y servicios con múltiples métodos de pago.',
    icon: DollarSign,
  },
  '/turnos': {
    title: 'Gestión de Turnos',
    description: 'Apertura y cierre de turnos con control de caja inicial y final.',
    icon: Clock,
  },
  '/cortes': {
    title: 'Cortes de Turno',
    description: 'Resumen detallado de ventas, gastos y caja por turno.',
    icon: FileText,
  },
  '/configuracion': {
    title: 'Configuración',
    description: 'Sucursales, métodos de pago, categorías y ajustes del sistema.',
    icon: Settings,
  },
};

export default function ComingSoon() {
  const location = useLocation();
  const info = pageInfo[location.pathname] || {
    title: 'Página en Construcción',
    description: 'Esta funcionalidad estará disponible próximamente.',
    icon: Wrench,
  };

  const Icon = info.icon;

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto fade-up">
        <div className="inline-flex p-6 rounded-2xl bg-primary/10 mb-6">
          <Icon className="h-12 w-12 text-primary" />
        </div>
        
        <h1 className="text-2xl font-bold mb-3">{info.title}</h1>
        <p className="text-muted-foreground mb-6">{info.description}</p>

        <div className="glass-card rounded-xl p-6 text-left">
          <p className="text-sm font-medium text-foreground mb-3">
            Esta sección incluirá:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              CRUD completo con formularios
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Filtros y búsqueda avanzada
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Tablas y vistas detalladas
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Persistencia en LocalStorage
            </li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          💡 Solicita implementar esta sección para continuar
        </p>
      </div>
    </div>
  );
}
