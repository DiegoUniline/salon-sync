import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FolderOpen,
  TrendingUp,
  Wallet,
  History,
  MessageCircle,
  Star,
  Search,
  Home,
  Users,
  BarChart3,
  Cog,
} from 'lucide-react';

type NavItem = { path: string; icon: typeof LayoutDashboard; label: string; moduleId: ModuleId };
type NavGroup = { title: string; icon: typeof LayoutDashboard; items: NavItem[] };

const groups: NavGroup[] = [
  {
    title: 'Inicio',
    icon: Home,
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard', moduleId: 'dashboard' },
      { path: '/superadmin', icon: Crown, label: 'Super Admin', moduleId: 'superadmin' },
    ],
  },
  {
    title: 'Operación',
    icon: Calendar,
    items: [
      { path: '/agenda', icon: Calendar, label: 'Agenda', moduleId: 'agenda' },
      { path: '/citas', icon: CalendarCheck, label: 'Citas', moduleId: 'agenda' },
      { path: '/pagos', icon: DollarSign, label: 'Pagos', moduleId: 'agenda' },
      { path: '/ventas', icon: DollarSign, label: 'Ventas', moduleId: 'ventas' },
      { path: '/whatsapp', icon: MessageCircle, label: 'WhatsApp', moduleId: 'whatsapp' },
    ],
  },
  {
    title: 'Catálogo',
    icon: FolderOpen,
    items: [
      { path: '/servicios', icon: Scissors, label: 'Servicios', moduleId: 'servicios' },
      { path: '/productos', icon: Package, label: 'Productos', moduleId: 'productos' },
      { path: '/catalogos', icon: FolderOpen, label: 'Catálogos', moduleId: 'catalogos' },
    ],
  },
  {
    title: 'Almacén y compras',
    icon: Warehouse,
    items: [
      { path: '/inventario', icon: Warehouse, label: 'Inventario', moduleId: 'inventario' },
      { path: '/compras', icon: ShoppingCart, label: 'Compras', moduleId: 'compras' },
      { path: '/proveedores', icon: Store, label: 'Proveedores', moduleId: 'proveedores' },
      { path: '/gastos', icon: Receipt, label: 'Gastos', moduleId: 'gastos' },
    ],
  },
  {
    title: 'Equipo',
    icon: Users,
    items: [
      { path: '/horarios', icon: CalendarClock, label: 'Horarios', moduleId: 'horarios' },
      { path: '/turnos', icon: Clock, label: 'Turnos', moduleId: 'turnos' },
      { path: '/cortes', icon: FileText, label: 'Cortes de caja', moduleId: 'cortes' },
      { path: '/comisiones', icon: Wallet, label: 'Comisiones', moduleId: 'comisiones' },
    ],
  },
  {
    title: 'Análisis',
    icon: BarChart3,
    items: [
      { path: '/reportes', icon: TrendingUp, label: 'Reportes', moduleId: 'reportes' },
      { path: '/auditoria', icon: History, label: 'Bitácora', moduleId: 'auditoria' },
    ],
  },
  {
    title: 'Administración',
    icon: Cog,
    items: [
      { path: '/permisos', icon: Shield, label: 'Permisos', moduleId: 'permisos' },
      { path: '/configuracion', icon: Settings, label: 'Configuración', moduleId: 'configuracion' },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useApp();
  const { canView, currentUser, currentRole, logout } = usePermissions();
  const { favorites, isFavorite, toggle } = useFavorites();
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.title, true]))
  );

  const q = search.trim().toLowerCase();

  const visibleGroups = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          items: g.items.filter(
            (i) => canView(i.moduleId) && (!q || i.label.toLowerCase().includes(q))
          ),
        }))
        .filter((g) => g.items.length > 0),
    [canView, q]
  );

  const visibleFavorites = useMemo(
    () => favorites.filter((f) => !q || f.label.toLowerCase().includes(q)),
    [favorites, q]
  );

  const toggleGroup = (t: string) => setOpenGroups((p) => ({ ...p, [t]: !p[t] }));

  const renderItem = (item: NavItem) => {
    const isActive = location.pathname === item.path;
    const fav = isFavorite(item.path);
    const Icon = item.icon;
    return (
      <li key={item.path} className="group/item relative">
        <NavLink
          to={item.path}
          className={cn('nav-item', isActive && 'active', sidebarCollapsed && 'justify-center px-2')}
          title={sidebarCollapsed ? item.label : undefined}
        >
          <Icon
            className={cn(
              'h-5 w-5 flex-shrink-0 text-sidebar-foreground',
              isActive && 'text-sidebar-primary-foreground'
            )}
          />
          {!sidebarCollapsed && <span className="flex-1 truncate">{item.label}</span>}
        </NavLink>
        {!sidebarCollapsed && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(item.path, item.label);
            }}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/item:opacity-100 hover:bg-sidebar-accent transition-opacity',
              fav && 'opacity-100'
            )}
            title={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            <Star
              className={cn(
                'h-3.5 w-3.5',
                fav ? 'fill-yellow-400 text-yellow-400' : 'text-sidebar-foreground/60'
              )}
            />
          </button>
        )}
      </li>
    );
  };

  return (
    <aside
      data-tour="sidebar"
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col',
        sidebarCollapsed ? 'w-[70px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
        <div className={cn('flex items-center gap-3 overflow-hidden', sidebarCollapsed && 'justify-center')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-bg">
            <Scissors className="h-5 w-5 text-primary-foreground" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-semibold text-sidebar-foreground whitespace-nowrap">SalonPro</span>
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

      {/* Search */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-3 pb-1 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar módulo..."
              className="pl-8 h-9 bg-sidebar-accent/40 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {/* Favorites */}
        {visibleFavorites.length > 0 && (
          <div className="mb-3">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/80">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                Favoritos
              </div>
            )}
            <ul className="space-y-1 mt-1">
              {visibleFavorites.map((f) => {
                const isActive = location.pathname === f.path;
                return (
                  <li key={f.id} className="group/item relative">
                    <NavLink
                      to={f.path}
                      className={cn(
                        'nav-item',
                        isActive && 'active',
                        sidebarCollapsed && 'justify-center px-2'
                      )}
                      title={sidebarCollapsed ? f.label : undefined}
                    >
                      <Star
                        className={cn(
                          'h-5 w-5 flex-shrink-0 fill-yellow-400 text-yellow-400'
                        )}
                      />
                      {!sidebarCollapsed && <span className="flex-1 truncate">{f.label}</span>}
                    </NavLink>
                    {!sidebarCollapsed && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggle(f.path, f.label);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover/item:opacity-100 hover:bg-sidebar-accent"
                        title="Quitar de favoritos"
                      >
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Grouped modules */}
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroups[group.title] ?? true;
          const forceOpen = !!q; // expand all when searching
          const show = forceOpen || isOpen;
          return (
            <div key={group.title} className="mb-2">
              {!sidebarCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center gap-2 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-sidebar-foreground/80 hover:text-sidebar-foreground transition-colors"
                >
                  <GroupIcon className="h-3.5 w-3.5" />
                  <span className="flex-1 text-left">{group.title}</span>
                  <ChevronRight
                    className={cn('h-3.5 w-3.5 transition-transform', show && 'rotate-90')}
                  />
                </button>
              ) : (
                <div className="h-px bg-sidebar-border my-2" />
              )}
              {show && <ul className="space-y-1 mt-1">{group.items.map(renderItem)}</ul>}
            </div>
          );
        })}

        {!sidebarCollapsed && visibleGroups.length === 0 && visibleFavorites.length === 0 && (
          <div className="text-center text-sm text-sidebar-foreground/50 py-8">
            Sin resultados para "{search}"
          </div>
        )}
      </nav>

      {/* User/Role indicator and Logout */}
      <div
        className={cn(
          'border-t border-sidebar-border p-3 space-y-2 flex-shrink-0',
          sidebarCollapsed && 'flex flex-col items-center'
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 text-sm text-sidebar-foreground/70',
            sidebarCollapsed && 'justify-center'
          )}
        >
          {currentUser && currentRole ? (
            <>
              <div
                className="h-4 w-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: currentRole.color }}
              />
              {!sidebarCollapsed && <span className="truncate">{currentUser.name}</span>}
            </>
          ) : (
            <>
              <Store className="h-4 w-4 flex-shrink-0 text-sidebar-foreground" />
              {!sidebarCollapsed && <span className="truncate">Sin usuario</span>}
            </>
          )}
        </div>

        {currentUser && (
          <Button
            variant="ghost"
            size={sidebarCollapsed ? 'icon' : 'sm'}
            onClick={logout}
            className={cn(
              'text-destructive hover:text-destructive hover:bg-destructive/10',
              sidebarCollapsed ? 'h-9 w-9' : 'w-full justify-start'
            )}
            title={sidebarCollapsed ? 'Cerrar sesión' : undefined}
          >
            <LogOut className="h-4 w-4 text-destructive" />
            {!sidebarCollapsed && <span className="ml-2">Cerrar sesión</span>}
          </Button>
        )}
      </div>
    </aside>
  );
}
