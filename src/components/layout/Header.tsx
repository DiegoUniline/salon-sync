import { useApp } from '@/contexts/AppContext';
import { usePermissions } from '@/hooks/usePermissions';
import { branches } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { MobileNav } from './MobileNav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sun,
  Moon,
  Search,
  Bell,
  User,
  Store,
  LogOut,
} from 'lucide-react';

export function Header() {
  const { currentBranch, setCurrentBranchId, theme, toggleTheme, sidebarCollapsed } = useApp();
  const { currentUser, currentRole, users, roles, setCurrentUserId, logout } = usePermissions();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300',
        // Mobile: full width, Desktop: account for sidebar
        'left-0 md:left-[70px]',
        !sidebarCollapsed && 'md:left-[260px]'
      )}
    >
      <div className="flex h-full items-center justify-between px-3 md:px-6 gap-3">
        {/* Mobile menu trigger */}
        <MobileNav />
        
        {/* Search - hidden on small mobile, visible from sm up */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Branch selector - compact on mobile */}
          <Select value={currentBranch?.id || ''} onValueChange={setCurrentBranchId}>
            <SelectTrigger className="w-auto md:w-[180px] bg-secondary/50 border-0">
              <Store className="h-4 w-4 md:mr-2 text-muted-foreground" />
              <span className="hidden md:inline"><SelectValue /></span>
            </SelectTrigger>
            <SelectContent>
              {branches.map(branch => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications - hidden on small mobile */}
          <Button variant="ghost" size="icon" className="h-9 w-9 relative hidden sm:flex">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {currentUser && currentRole ? (
                  <div 
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: currentRole.color }}
                  >
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  {currentUser ? (
                    <>
                      <p className="text-sm font-medium">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {currentRole && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs"
                            style={{ backgroundColor: currentRole.color + '20', color: currentRole.color }}
                          >
                            {currentRole.name}
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Selecciona un usuario para iniciar</p>
                  )}
                </div>
              </DropdownMenuLabel>
              
              {/* Only show user list if no user is logged in OR current user is admin */}
              {(!currentUser || currentRole?.id === 'admin') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                    {currentUser ? 'Cambiar usuario (Admin)' : 'Iniciar sesión como'}
                  </DropdownMenuLabel>
                  {users.filter(u => u.active).map(user => {
                    const role = roles.find(r => r.name.toLowerCase() === user.role?.toLowerCase());
                    return (
                      <DropdownMenuItem 
                        key={user.id}
                        onClick={() => setCurrentUserId(user.id)}
                        className={cn(
                          'cursor-pointer',
                          currentUser?.id === user.id && 'bg-accent'
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div 
                            className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: role?.color || '#666' }}
                          >
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{role?.name}</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
              
              {currentUser && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
