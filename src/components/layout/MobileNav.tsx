import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  CalendarCheck,
  Users,
  Scissors,
  Package,
  ShoppingCart,
  DollarSign,
  Receipt,
  ShoppingBag,
  Clock,
  CreditCard,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import type { ModuleId } from '@/lib/permissions';

interface NavItem {
  path: string;
  icon: typeof LayoutDashboard;
  label: string;
  moduleId: ModuleId;
}

const navItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', moduleId: 'dashboard' },
  { path: '/agenda', icon: Calendar, label: 'Agenda', moduleId: 'agenda' },
  { path: '/citas', icon: CalendarCheck, label: 'Citas', moduleId: 'agenda' },
  { path: '/pagos', icon: DollarSign, label: 'Pagos', moduleId: 'agenda' },
  { path: '/servicios', icon: Scissors, label: 'Servicios', moduleId: 'servicios' },
  { path: '/productos', icon: Package, label: 'Productos', moduleId: 'productos' },
  { path: '/ventas', icon: ShoppingCart, label: 'Ventas', moduleId: 'ventas' },
  { path: '/gastos', icon: Receipt, label: 'Gastos', moduleId: 'gastos' },
  { path: '/compras', icon: ShoppingBag, label: 'Compras', moduleId: 'compras' },
  { path: '/proveedores', icon: ShoppingBag, label: 'Proveedores', moduleId: 'proveedores' as any },
  { path: '/horarios', icon: Clock, label: 'Horarios', moduleId: 'horarios' },
  { path: '/turnos', icon: CreditCard, label: 'Turnos', moduleId: 'turnos' },
  { path: '/cortes', icon: DollarSign, label: 'Cortes', moduleId: 'cortes' },
  { path: '/permisos', icon: Users, label: 'Permisos', moduleId: 'permisos' },
  { path: '/configuracion', icon: Settings, label: 'Configuración', moduleId: 'configuracion' },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { currentUser, currentRole, logout, canView } = usePermissions();
  
  const visibleItems = navItems.filter(item => canView(item.moduleId));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
          <Menu className="h-5 w-5 text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <SheetTitle className="text-lg font-bold">SalonPro</SheetTitle>
          </div>
        </SheetHeader>
        
        {/* User info */}
        {currentUser && currentRole && (
          <div className="p-4 bg-muted/50 border-b">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: currentRole.color }}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentRole.name}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0 text-current" />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-current" />}
              </NavLink>
            );
          })}
        </nav>
        
        {/* Logout */}
        <div className="p-3 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => {
              logout();
              setOpen(false);
            }}
          >
            <LogOut className="h-4 w-4 mr-3 text-destructive" />
            Cerrar sesión
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
