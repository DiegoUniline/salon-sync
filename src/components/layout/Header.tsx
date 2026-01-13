import { useApp } from '@/contexts/AppContext';
import { branches } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sun,
  Moon,
  Search,
  Bell,
  User,
  Store,
} from 'lucide-react';

export function Header() {
  const { currentBranch, setCurrentBranchId, theme, toggleTheme, sidebarCollapsed } = useApp();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-300',
        sidebarCollapsed ? 'left-[70px]' : 'left-[260px]'
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, citas, servicios..."
            className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Branch selector */}
          <Select value={currentBranch.id} onValueChange={setCurrentBranchId}>
            <SelectTrigger className="w-[180px] bg-secondary/50 border-0">
              <Store className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
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

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
          </Button>

          {/* User menu */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <div className="h-8 w-8 rounded-full gradient-bg flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
