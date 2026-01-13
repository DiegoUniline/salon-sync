import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Scissors,
  Package,
  Warehouse,
  ShoppingCart,
  Receipt,
  DollarSign,
  Clock,
  FileText,
  CalendarClock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Store,
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/agenda', icon: Calendar, label: 'Agenda' },
  { path: '/citas', icon: CalendarCheck, label: 'Citas' },
  { path: '/servicios', icon: Scissors, label: 'Servicios' },
  { path: '/productos', icon: Package, label: 'Productos' },
  { path: '/inventario', icon: Warehouse, label: 'Inventario' },
  { path: '/compras', icon: ShoppingCart, label: 'Compras' },
  { path: '/gastos', icon: Receipt, label: 'Gastos' },
  { path: '/ventas', icon: DollarSign, label: 'Ventas' },
  { path: '/turnos', icon: Clock, label: 'Turnos' },
  { path: '/cortes', icon: FileText, label: 'Cortes' },
  { path: '/horarios', icon: CalendarClock, label: 'Horarios' },
  { path: '/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useApp();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3 overflow-hidden', sidebarCollapsed && 'justify-center')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
            <Scissors className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-sidebar-foreground whitespace-nowrap">
              SalonPro
            </span>
          )}
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors',
            sidebarCollapsed && 'absolute -right-3 top-6 bg-card border border-border shadow-md'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <li key={path}>
                <NavLink
                  to={path}
                  className={cn(
                    'nav-item',
                    isActive && 'active',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary-foreground')} />
                  {!sidebarCollapsed && <span>{label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Branch indicator */}
      <div className={cn(
        'border-t border-sidebar-border p-3',
        sidebarCollapsed && 'flex justify-center'
      )}>
        <div className={cn(
          'flex items-center gap-2 text-sm text-sidebar-foreground/70',
          sidebarCollapsed && 'justify-center'
        )}>
          <Store className="h-4 w-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="truncate">Sucursal Centro</span>}
        </div>
      </div>
    </aside>
  );
}
