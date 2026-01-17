import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { type ModuleId } from '@/lib/permissions';
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
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Crown,
} from 'lucide-react';

const navItems: { path: string; icon: typeof LayoutDashboard; label: string; moduleId: ModuleId }[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', moduleId: 'dashboard' },
  { path: '/superadmin', icon: Crown, label: 'Super Admin', moduleId: 'superadmin' },
  { path: '/agenda', icon: Calendar, label: 'Agenda', moduleId: 'agenda' },
  { path: '/citas', icon: CalendarCheck, label: 'Citas', moduleId: 'agenda' },
  { path: '/pagos', icon: DollarSign, label: 'Pagos', moduleId: 'agenda' },
  { path: '/servicios', icon: Scissors, label: 'Servicios', moduleId: 'servicios' },
  { path: '/productos', icon: Package, label: 'Productos', moduleId: 'productos' },
  { path: '/inventario', icon: Warehouse, label: 'Inventario', moduleId: 'inventario' },
  { path: '/compras', icon: ShoppingCart, label: 'Compras', moduleId: 'compras' },
  { path: '/gastos', icon: Receipt, label: 'Gastos', moduleId: 'gastos' },
  { path: '/ventas', icon: DollarSign, label: 'Ventas', moduleId: 'ventas' },
  { path: '/turnos', icon: Clock, label: 'Turnos', moduleId: 'turnos' },
  { path: '/cortes', icon: FileText, label: 'Cortes', moduleId: 'cortes' },
  { path: '/horarios', icon: CalendarClock, label: 'Horarios', moduleId: 'horarios' },
  { path: '/permisos', icon: Shield, label: 'Permisos', moduleId: 'permisos' },
  { path: '/configuracion', icon: Settings, label: 'Configuración', moduleId: 'configuracion' },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useApp();
  const { canView, currentUser, currentRole, logout } = usePermissions();

  // Filter nav items based on permissions
  const visibleItems = navItems.filter(item => canView(item.moduleId));

  return (
    <aside
      data-tour="sidebar"
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3 overflow-hidden', sidebarCollapsed && 'justify-center')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
            <Scissors className="h-5 w-5 text-primary-foreground" />
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
          {visibleItems.map(({ path, icon: Icon, label }) => {
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

      {/* User/Role indicator and Logout */}
      <div className={cn(
        'border-t border-sidebar-border p-3 space-y-2',
        sidebarCollapsed && 'flex flex-col items-center'
      )}>
        <div className={cn(
          'flex items-center gap-2 text-sm text-sidebar-foreground/70',
          sidebarCollapsed && 'justify-center'
        )}>
          {currentUser && currentRole ? (
            <>
              <div 
                className="h-4 w-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: currentRole.color }}
              />
              {!sidebarCollapsed && (
                <span className="truncate">{currentUser.name}</span>
              )}
            </>
          ) : (
            <>
              <Store className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">Sin usuario</span>}
            </>
          )}
        </div>
        
        {currentUser && (
          <Button
            variant="ghost"
            size={sidebarCollapsed ? "icon" : "sm"}
            onClick={logout}
            className={cn(
              'text-destructive hover:text-destructive hover:bg-destructive/10',
              sidebarCollapsed ? 'h-9 w-9' : 'w-full justify-start'
            )}
            title={sidebarCollapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!sidebarCollapsed && <span className="ml-2">Cerrar sesión</span>}
          </Button>
        )}
      </div>
    </aside>
  );
}
